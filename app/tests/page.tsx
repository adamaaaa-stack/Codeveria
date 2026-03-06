import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function TestsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Skill tests</h1>
        <p className="text-muted-foreground">
          Pass tests to verify your skills and get verified levels on your
          profile.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="transition-colors hover:bg-muted/50">
          <Link href="/tests/react-basics">
            <CardHeader>
              <CardTitle>React basics</CardTitle>
              <CardDescription>Placeholder test. Slug: react-basics</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Not taken</p>
            </CardContent>
          </Link>
        </Card>
      </div>
    </div>
  );
}
