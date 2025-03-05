// pages/dashboard.js
import { useSession } from 'next-auth/react';
import Link from 'next/link';

export default function Dashboard() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return <p>Loading...</p>;
  }

  if (!session) {
    return <p>Not signed in</p>;
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Dashboard</h1>
      <p>Signed in as {session.user.email}</p>
      <p className="mt-4">
        <Link href="/">
          <a className="text-blue-500 hover:underline">Go to Home</a>
        </Link>
      </p>
    </div>
  );
}