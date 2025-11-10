export default function TrainingPage() {
  return (
    <div className="container mx-auto px-md py-lg">
      <h1 className="text-2xl font-bold text-[color:var(--foreground)] mb-md">Training</h1>
      <p className="text-[color:var(--foreground)]/80">Training programs coming soon.</p>
      <div className="grid gap-md mt-lg">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white rounded-lg shadow-md p-md h-32 flex items-center justify-center text-gray-400">
            Training Card Placeholder {i}
          </div>
        ))}
      </div>
    </div>
  )
}
