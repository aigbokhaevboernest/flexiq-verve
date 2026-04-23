import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Construction } from "lucide-react";
import { Link } from "react-router-dom";

export const ComingSoon = ({ title, description }: { title: string; description: string }) => (
  <div className="space-y-6">
    <div>
      <h1 className="font-display text-2xl font-bold sm:text-3xl">{title}</h1>
      <p className="mt-1 text-muted-foreground">{description}</p>
    </div>
    <Card className="flex flex-col items-center justify-center gap-4 rounded-3xl border-border/60 p-12 text-center shadow-card">
      <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-primary text-primary-foreground shadow-glow">
        <Construction className="h-7 w-7" />
      </span>
      <div>
        <h3 className="font-display text-xl font-bold">We're building this</h3>
        <p className="mt-1 max-w-md text-sm text-muted-foreground">
          This feature is coming in the next iteration. Reach out to support if you need help.
        </p>
      </div>
      <Button asChild variant="outline">
        <Link to="/dashboard">Back to dashboard</Link>
      </Button>
    </Card>
  </div>
);

export default ComingSoon;
