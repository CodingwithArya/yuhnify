import { auth, signIn } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function HomePage() {
  const session = await auth();

  if (session?.accessToken) {
    redirect("/dashboard");
  }

  async function connectWithStrava() {
    "use server";
    await signIn("strava", { redirectTo: "/dashboard" });
  }

  return (
    <main className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-8">
      <div className="max-w-md w-full text-center space-y-8">
        <div className="space-y-2">
          <div className="text-5xl font-bold tracking-tight text-white">
            yuhnify
            <span className="text-orange-500">.</span>
          </div>
          <p className="text-zinc-400 text-lg">
            Your fitness data, finally in one place
          </p>
        </div>

        <div className="text-left space-y-3">
          {[
            "Connects directly to your Strava — no screenshots",
            "Weekly training plans calibrated to your actual data",
            "Music correlation to find your power songs",
            "Apple Health sync for full recovery context",
          ].map((feature) => (
            <div key={feature} className="flex items-center gap-3 text-zinc-300">
              <div className="w-1.5 h-1.5 rounded-full bg-orange-500 flex-shrink-0" />
              <span className="text-sm">{feature}</span>
            </div>
          ))}
        </div>

        <form action={connectWithStrava}>
          <button
            type="submit"
            className="w-full py-4 px-8 rounded-xl bg-orange-500 text-white font-semibold hover:bg-orange-400 transition-colors flex items-center justify-center gap-3 text-base"
          >
            Connect with Strava
          </button>
        </form>

        <p className="text-zinc-600 text-xs">
          Read-only access. We never post to Strava.
        </p>
      </div>
    </main>
  );
}