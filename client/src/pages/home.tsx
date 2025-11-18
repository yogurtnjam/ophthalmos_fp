import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <Card className="max-w-2xl w-full">
        <CardHeader>
          <CardTitle className="text-3xl">Blank Fullstack JavaScript App</CardTitle>
          <CardDescription>
            Your project is ready. Start building by editing the files in this project.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold mb-2">Frontend</h3>
            <p className="text-sm text-muted-foreground">
              Edit <code className="bg-muted px-1 py-0.5 rounded">client/src/pages/home.tsx</code> to customize this page
            </p>
          </div>
          <div>
            <h3 className="font-semibold mb-2">Backend</h3>
            <p className="text-sm text-muted-foreground">
              Add API routes in <code className="bg-muted px-1 py-0.5 rounded">server/routes.ts</code>
            </p>
          </div>
          <div>
            <h3 className="font-semibold mb-2">Data Models</h3>
            <p className="text-sm text-muted-foreground">
              Define schemas in <code className="bg-muted px-1 py-0.5 rounded">shared/schema.ts</code>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
