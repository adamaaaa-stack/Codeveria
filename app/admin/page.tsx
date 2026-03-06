import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function AdminPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Admin</h1>
        <p className="text-muted-foreground">
          Platform administration. Access restricted.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Admin dashboard</CardTitle>
          <CardDescription>Placeholder. Users, disputes, and payouts will be managed here.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No admin actions yet.</p>
        </CardContent>
      </Card>
    </div>
  );
}
