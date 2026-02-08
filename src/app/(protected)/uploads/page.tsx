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
import { createClient } from "@/lib/supabase/client";
import { deleteStatementFile } from "@/lib/storage";
import type { Database } from "@/lib/types/database.types";

type Statement = Database["public"]["Tables"]["statements"]["Row"];
type CategoryRule = Database["public"]["Tables"]["category_rules"]["Row"];
type Category = Database["public"]["Tables"]["categories"]["Row"];

export default function UploadsPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [statements, setStatements] = useState<Statement[]>([]);
  const [rules, setRules] = useState<CategoryRule[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      setUserId(user.id);

      const stmtRes = await supabase
        .from("statements")
        .select("*")
        .eq("user_id", user.id)
        .order("upload_date", { ascending: false })
        .returns<Statement[]>();

      const ruleRes = await supabase
        .from("category_rules")
        .select("*")
        .eq("user_id", user.id)
        .returns<CategoryRule[]>();

      const catRes = await supabase
        .from("categories")
        .select("*")
        .eq("user_id", user.id)
        .order("name")
        .returns<Category[]>();

      if (stmtRes.data) setStatements(stmtRes.data);
      if (ruleRes.data) setRules(ruleRes.data);
      if (catRes.data) setCategories(catRes.data);
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
      const supabase = createClient();

      // Delete file from storage if it exists
      if (stmt.storage_path) {
        await deleteStatementFile(supabase, stmt.storage_path);
      }

      // Delete statement (cascades to transactions)
      const { error } = await supabase
        .from("statements")
        .delete()
        .eq("id", stmt.id);

      if (error) throw new Error(error.message);

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

  if (!userId) return null;

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
                userId={userId}
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
                userId={userId}
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
