"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Loader2, Save, Plus, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import dynamic from "next/dynamic";

const BlockNoteEditor = dynamic(() => import("@/components/blocknote-editor"), {
  ssr: false,
  loading: () => (
    <div className="h-[200px] rounded-lg border bg-muted/30 flex items-center justify-center text-muted-foreground text-sm">
      加载编辑器...
    </div>
  ),
});

interface TestCase {
  input: string;
  output: string;
}

interface ProblemForm {
  title: string;
  slug: string;
  difficulty: string;
  description: string;
  inputDesc: string;
  outputDesc: string;
  sampleInput: string;
  sampleOutput: string;
  selfTestSamples: TestCase[];
  testCases: TestCase[];
  timeLimit: number;
  memoryLimit: number;
  tags: string[];
  aiMode: string;
}

const emptyForm: ProblemForm = {
  title: "",
  slug: "",
  difficulty: "Easy",
  description: "",
  inputDesc: "",
  outputDesc: "",
  sampleInput: "",
  sampleOutput: "",
  selfTestSamples: [{ input: "", output: "" }],
  testCases: [{ input: "", output: "" }],
  timeLimit: 5,
  memoryLimit: 256,
  tags: [],
  aiMode: "",
};

export default function ProblemEditPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session, status } = useSession();
  const isNew = params.id === "new";

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (status === "authenticated" && !session.user.isAdmin) {
      router.push("/");
    }
  }, [status, session, router]);

  const [form, setForm] = useState<ProblemForm>(emptyForm);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [newTag, setNewTag] = useState("");

  useEffect(() => {
    if (!isNew && params.id) {
      fetch(`/api/problems/${params.id}`)
        .then((r) => r.json())
        .then((data) => {
          // Parse testCases JSON into array
          let testCasesArr: TestCase[] = [{ input: "", output: "" }];
          try {
            const parsed = JSON.parse(data.testCases || "[]");
            if (Array.isArray(parsed) && parsed.length > 0) {
              testCasesArr = parsed;
            }
          } catch {}

          // Parse selfTestSamples JSON into array
          let selfTestSamplesArr: TestCase[] = [{ input: "", output: "" }];
          try {
            const parsed = JSON.parse(data.selfTestSamples || "[]");
            if (Array.isArray(parsed) && parsed.length > 0) {
              selfTestSamplesArr = parsed;
            }
          } catch {}

          // Parse tags JSON into array
          let tagsArr: string[] = [];
          try {
            const parsed = JSON.parse(data.tags || "[]");
            if (Array.isArray(parsed)) {
              tagsArr = parsed.filter(Boolean);
            }
          } catch {}

          setForm({
            title: data.title || "",
            slug: data.slug || "",
            difficulty: data.difficulty || "Easy",
            aiMode: data.aiMode || "",
            description: data.description || "",
            inputDesc: data.inputDesc || "",
            outputDesc: data.outputDesc || "",
            sampleInput: data.sampleInput || "",
            sampleOutput: data.sampleOutput || "",
            selfTestSamples: selfTestSamplesArr,
            testCases: testCasesArr,
            timeLimit: data.timeLimit || 5,
            memoryLimit: data.memoryLimit || 256,
            tags: tagsArr,
          });
          setLoading(false);
        });
    }
  }, [isNew, params.id]);

  const handleSave = async () => {
    setSaving(true);
    try {
      // Convert tags: array → JSON array
      const tagsJson = JSON.stringify(form.tags.filter(Boolean));

      // Convert testCases: array → JSON string
      const testCasesJson = JSON.stringify(form.testCases);
      const selfTestSamplesJson = JSON.stringify(form.selfTestSamples);

      const payload = {
        ...(isNew ? {} : { id: parseInt(params.id as string) }),
        title: form.title,
        slug: form.slug,
        difficulty: form.difficulty,
        aiMode: form.aiMode,
        description: form.description,
        inputDesc: form.inputDesc,
        outputDesc: form.outputDesc,
        sampleInput: form.sampleInput,
        sampleOutput: form.sampleOutput,
        selfTestSamples: selfTestSamplesJson,
        testCases: testCasesJson,
        timeLimit: form.timeLimit,
        memoryLimit: form.memoryLimit,
        tags: tagsJson,
      };

      if (isNew) {
        const res = await fetch("/api/admin/problems", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        router.replace(`/admin/problems/${data.id}/edit`);
      } else {
        await fetch("/api/admin/problems", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }
      router.push("/admin/problems");
    } finally {
      setSaving(false);
    }
  };

  const addTag = () => {
    const tag = newTag.trim();
    if (tag && !form.tags.includes(tag)) {
      setForm({ ...form, tags: [...form.tags, tag] });
    }
    setNewTag("");
  };

  const removeTag = (index: number) => {
    setForm({ ...form, tags: form.tags.filter((_, i) => i !== index) });
  };

  const addTestCase = () => {
    setForm({ ...form, testCases: [...form.testCases, { input: "", output: "" }] });
  };

  const removeTestCase = (index: number) => {
    if (form.testCases.length <= 1) return;
    setForm({
      ...form,
      testCases: form.testCases.filter((_, i) => i !== index),
    });
  };

  const updateTestCase = (index: number, field: "input" | "output", value: string) => {
    const updated = [...form.testCases];
    updated[index] = { ...updated[index], [field]: value };
    setForm({ ...form, testCases: updated });
  };

  const addSelfTestSample = () => {
    setForm({ ...form, selfTestSamples: [...form.selfTestSamples, { input: "", output: "" }] });
  };

  const removeSelfTestSample = (index: number) => {
    if (form.selfTestSamples.length <= 1) return;
    setForm({
      ...form,
      selfTestSamples: form.selfTestSamples.filter((_, i) => i !== index),
    });
  };

  const updateSelfTestSample = (index: number, field: "input" | "output", value: string) => {
    const updated = [...form.selfTestSamples];
    updated[index] = { ...updated[index], [field]: value };
    setForm({ ...form, selfTestSamples: updated });
  };

  if (status === "loading" || status !== "authenticated") {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6 py-6 space-y-6">
      {/* Top bar */}
      <div className="flex items-center justify-between">
        <Button onClick={handleSave} disabled={saving} className="gap-2">
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          {saving ? "保存中..." : "保存"}
        </Button>
      </div>

      <h1 className="text-2xl font-bold tracking-tight">
        {isNew ? "新建题目" : "编辑题目"}
      </h1>

      {/* Basic Info */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">基本信息</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>标题</Label>
              <Input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="A + B Problem"
              />
            </div>
            <div className="space-y-2">
              <Label>Slug</Label>
              <Input
                value={form.slug}
                onChange={(e) => setForm({ ...form, slug: e.target.value })}
                placeholder="a-plus-b"
              />
            </div>
          </div>
          <div className="grid grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>难度</Label>
              <Select
                value={form.difficulty}
                onValueChange={(v) => setForm({ ...form, difficulty: v ?? "Easy" })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Easy">Easy</SelectItem>
                  <SelectItem value="Medium">Medium</SelectItem>
                  <SelectItem value="Hard">Hard</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>AI</Label>
              <Select
                value={form.aiMode}
                onValueChange={(v) => setForm({ ...form, aiMode: v ?? "" })}
              >
                <SelectTrigger><SelectValue>{(v) => v === "off" ? "关闭" : "启用"}</SelectValue></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">启用</SelectItem>
                  <SelectItem value="off">关闭</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>时间限制 (s)</Label>
              <Input
                type="number"
                value={form.timeLimit}
                onChange={(e) =>
                  setForm({ ...form, timeLimit: parseInt(e.target.value) || 5 })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>内存限制 (MB)</Label>
              <Input
                type="number"
                value={form.memoryLimit}
                onChange={(e) =>
                  setForm({ ...form, memoryLimit: parseInt(e.target.value) || 256 })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>标签</Label>
              <div className="flex flex-wrap gap-1.5 p-2 rounded-md border min-h-[38px] bg-background">
                {form.tags.map((tag, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-primary/10 text-primary text-xs font-medium"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(i)}
                      className="hover:text-destructive transition-colors"
                      title={`删除标签 ${tag}`}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
                <input
                  type="text"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addTag();
                    }
                  }}
                  placeholder="输入标签后回车添加"
                  className="flex-1 min-w-[80px] text-xs bg-transparent outline-none placeholder:text-muted-foreground"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Description - BlockNote Editor */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">题目描述</CardTitle>
        </CardHeader>
        <CardContent>
          <BlockNoteEditor
            value={form.description}
            onChange={(val) => setForm({ ...form, description: val })}
            placeholder="使用 BlockNote 编写题目描述..."
          />
        </CardContent>
      </Card>

      {/* Input Description - BlockNote Editor */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">输入描述</CardTitle>
        </CardHeader>
        <CardContent>
          <BlockNoteEditor
            value={form.inputDesc}
            onChange={(val) => setForm({ ...form, inputDesc: val })}
            placeholder="使用 BlockNote 编写输入描述..."
          />
        </CardContent>
      </Card>

      {/* Output Description - BlockNote Editor */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">输出描述</CardTitle>
        </CardHeader>
        <CardContent>
          <BlockNoteEditor
            value={form.outputDesc}
            onChange={(val) => setForm({ ...form, outputDesc: val })}
            placeholder="使用 BlockNote 编写输出描述..."
          />
        </CardContent>
      </Card>

      {/* Sample Input/Output */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">样例</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>样例输入</Label>
              <Textarea
                value={form.sampleInput}
                onChange={(e) => setForm({ ...form, sampleInput: e.target.value })}
                rows={4}
                className="font-mono text-xs"
              />
            </div>
            <div className="space-y-2">
              <Label>样例输出</Label>
              <Textarea
                value={form.sampleOutput}
                onChange={(e) => setForm({ ...form, sampleOutput: e.target.value })}
                rows={4}
                className="font-mono text-xs"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Self-test Samples */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">自测样例</CardTitle>
            <Button variant="outline" size="sm" onClick={addSelfTestSample} className="gap-1">
              <Plus className="h-3.5 w-3.5" /> 添加样例
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {form.selfTestSamples.map((tc, i) => (
            <div key={i} className="flex gap-3 items-start">
              <span className="text-xs text-muted-foreground pt-2 w-6 shrink-0 text-right">
                #{i + 1}
              </span>
              <div className="grid grid-cols-2 gap-3 flex-1">
                <Textarea
                  value={tc.input}
                  onChange={(e) => updateSelfTestSample(i, "input", e.target.value)}
                  placeholder="输入数据"
                  rows={3}
                  className="font-mono text-xs"
                />
                <Textarea
                  value={tc.output}
                  onChange={(e) => updateSelfTestSample(i, "output", e.target.value)}
                  placeholder="期望输出"
                  rows={3}
                  className="font-mono text-xs"
                />
              </div>
              <button
                type="button"
                onClick={() => removeSelfTestSample(i)}
                disabled={form.selfTestSamples.length <= 1}
                className="p-1.5 text-muted-foreground hover:text-red-500 transition-colors disabled:opacity-30"
                title={`删除自测样例 #${i + 1}`}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Test Cases - Structured UI */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">测试用例（判题用，用户不可见）</CardTitle>
            <Button variant="outline" size="sm" onClick={addTestCase} className="gap-1">
              <Plus className="h-3.5 w-3.5" /> 添加用例
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {form.testCases.map((tc, i) => (
            <div key={i} className="flex gap-3 items-start">
              <span className="text-xs text-muted-foreground pt-2 w-6 shrink-0 text-right">
                #{i + 1}
              </span>
              <div className="grid grid-cols-2 gap-3 flex-1">
                <Textarea
                  value={tc.input}
                  onChange={(e) => updateTestCase(i, "input", e.target.value)}
                  placeholder="输入数据"
                  rows={3}
                  className="font-mono text-xs"
                />
                <Textarea
                  value={tc.output}
                  onChange={(e) => updateTestCase(i, "output", e.target.value)}
                  placeholder="期望输出"
                  rows={3}
                  className="font-mono text-xs"
                />
              </div>
              <button
                type="button"
                onClick={() => removeTestCase(i)}
                disabled={form.testCases.length <= 1}
                className="p-1.5 text-muted-foreground hover:text-red-500 transition-colors disabled:opacity-30"
                title={`删除测试用例 #${i + 1}`}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
