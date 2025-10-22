import Fastify from 'fastify';
import cors from '@fastify/cors';
import dotenv from 'dotenv';
import opportunities from '../../../packages/ingestion/data/curated/sa_opportunities.json' with { type: 'json' };
import { z } from 'zod';
import crypto from 'node:crypto';
import { UserProfileSchema, type UserProfile, evaluateRule, explainMatch, calculateMatchScore } from '@cyclebreaker/shared';

dotenv.config();

const app = Fastify({ logger: true });
await app.register(cors, { origin: true });

// In-memory storage for MVP (replace with database later)
const profiles = new Map<string, UserProfile>();

// Helpers
const CreateProfileBodySchema = UserProfileSchema.omit({ id: true, created_at: true, updated_at: true });

app.post('/profiles', async (request, reply) => {
  try {
    const parsed = CreateProfileBodySchema.parse(request.body);
    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    const profile: UserProfile = {
      ...parsed,
      id,
      created_at: now,
      updated_at: now,
    } as UserProfile;

    profiles.set(id, profile);
    return reply.status(201).send({ id });
  } catch (err) {
    return reply.status(400).send({ error: 'Invalid profile data' });
  }
});

app.get('/feed', async (request, reply) => {
  const querySchema = z.object({ profile_id: z.string().uuid() });
  const parsed = querySchema.safeParse(request.query);

  if (!parsed.success) {
    return reply.status(400).send({ error: 'profile_id is required (uuid)' });
  }

  const profile = profiles.get(parsed.data.profile_id);
  if (!profile) {
    return reply.status(404).send({ error: 'Profile not found' });
  }

  const matches = (opportunities as any[])
    .filter((opp) => {
      // All rules in eligibility_rules must pass
      return Array.isArray(opp.eligibility_rules) && opp.eligibility_rules.every((rule: any) => evaluateRule(rule, profile));
    })
    .map((opp) => {
      const isEligible = true;
      const explanation = explainMatch(opp.eligibility_rules[0], profile);
      const match_score = calculateMatchScore(opp, profile, isEligible);
      return {
        opportunity: opp,
        match_score,
        why: explanation.matched_clauses,
        matched_profile_fields: explanation.matched_profile_fields,
        disqualifiers: explanation.disqualifiers,
      };
    })
    .sort((a, b) => b.match_score - a.match_score);

  return reply.send({ matches });
});

app.get('/opportunities/:id', async (request, reply) => {
  const params = z.object({ id: z.string() }).parse(request.params);
  const opp = (opportunities as any[]).find((o) => o.id === params.id);
  if (!opp) return reply.status(404).send({ error: 'Opportunity not found' });
  return reply.send(opp);
});

const PORT = Number(process.env.PORT || 4000);
const HOST = '0.0.0.0';

app
  .listen({ port: PORT, host: HOST })
  .then((address) => {
    app.log.info(`API listening at ${address}`);
  })
  .catch((err) => {
    app.log.error(err);
    process.exit(1);
  });

