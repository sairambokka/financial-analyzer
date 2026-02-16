"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { Trash2, FileText } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { CSVUploadFlow } from "@/components/upload/csv-upload-flow";
import { PDFUploadFlow } from "@/components/upload/pdf-upload-flow";
import type { Statement, CategoryRule, Category } from "@/lib/types/database.types";

export default function UploadsPage() {
  const [statements, setStatements] = useState<Statement[]>([]);
  const [rules, setRules] = useState<CategoryRule[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const [stmtRes, ruleRes, catRes] = await Promise.all([
        fetch("/api/statements"),
        fetch("/api/category-rules"),
        fetch("/api/categories"),
      ]);

      if (stmtRes.ok) setStatements(await stmtRes.json());
      if (ruleRes.ok) setRules(await ruleRes.json());
      if (catRes.ok) setCategories(await catRes.json());
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  async function handleDeleteStatement(stmt: Statement) {
    try {
      const res = await fetch(`/api/statements/${stmt.id}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to delete");

      setStatements((prev) => prev.filter((s) => s.id !== stmt.id));
      toast.success("Statement and its transactions deleted");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete");
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Upload Statements</h1>

      <Tabs defaultValue="csv">
        <TabsList>
          <TabsTrigger value="csv">CSV</TabsTrigger>
          <TabsTrigger value="pdf">PDF</TabsTrigger>
        </TabsList>

        <TabsContent value="csv" className="mt-4">
          <Card>
            <CardContent className="pt-6">
              <CSVUploadFlow
                rules={rules}
                categories={categories}
                onComplete={fetchData}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pdf" className="mt-4">
          <Card>
            <CardContent className="pt-6">
              <PDFUploadFlow
                rules={rules}
                categories={categories}
                onComplete={fetchData}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {statements.length > 0 && (
        <>
          <Separator />
          <div className="space-y-3">
            <h2 className="text-lg font-semibold">Uploaded Statements</h2>
            {statements.map((stmt) => (
              <Card key={stmt.id}>
                <CardContent className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">{stmt.file_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {stmt.file_type?.toUpperCase()} &middot;{" "}
                        {new Date(stmt.upload_date).toLocaleDateString()}
                        {stmt.period_start && stmt.period_end && (
                          <> &middot; {stmt.period_start} to {stmt.period_end}</>
                        )}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive"
                    onClick={() => handleDeleteStatement(stmt)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
