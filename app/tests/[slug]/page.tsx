import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";

export default function TestPage({
  params,
}: {
  params: { slug: string };
}) {
  const { slug } = params;
  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" asChild>
        <Link href="/tests" className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to tests
        </Link>
      </Button>
      <Card>
        <CardHeader>
          <CardTitle>Skill test: {slug}</CardTitle>
          <CardDescription>
            Placeholder. Test content and submit will be implemented later.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button>Start test</Button>
        </CardContent>
      </Card>
    </div>
  );
}
