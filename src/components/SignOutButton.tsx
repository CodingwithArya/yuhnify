import { signOut } from "@/lib/auth";

export function SignOutButton() {
  return (
    <form
      action={async () => {
        "use server";
        await signOut({ redirectTo: "/" });
      }}
    >
      <button
        type="submit"
        className="text-sm text-[#71717a] hover:text-white transition-colors"
      >
        Sign out
      </button>
    </form>
  );
}
