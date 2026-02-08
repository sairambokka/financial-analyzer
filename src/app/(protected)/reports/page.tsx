import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText } from "lucide-react";

export default function ReportsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Reports</h1>
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <FileText className="mb-4 h-12 w-12 text-muted-foreground" />
          <CardHeader className="p-0">
            <CardTitle className="text-lg">No reports yet</CardTitle>
          </CardHeader>
          <p className="mt-2 text-sm text-muted-foreground">
            Reports will be available once you upload and analyze your financial
            statements.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
