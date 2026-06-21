"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Loader2, CheckCircle, XCircle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

function VerifyContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    !token ? "error" : "loading"
  );
  const [message, setMessage] = useState(
    !token ? "缺少验证令牌，请检查邮箱中的链接是否完整。" : ""
  );

  useEffect(() => {
    if (!token) return;

    fetch("/api/auth/verify-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          setStatus("success");
          setMessage("邮箱验证成功！现在可以登录使用全部功能了。");
        } else {
          setStatus("error");
          setMessage(data.error || "验证失败，请重试。");
        }
      })
      .catch(() => {
        setStatus("error");
        setMessage("网络错误，请稍后重试。");
      });
  }, [token]);

  return (
    <div className="flex items-center justify-center min-h-[60vh] px-4">
      <Card className="w-full max-w-sm border-border/50">
        <CardHeader className="text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 text-primary mb-2">
            {status === "loading" ? (
              <Loader2 className="h-7 w-7 animate-spin" />
            ) : status === "success" ? (
              <CheckCircle className="h-7 w-7 text-emerald-500" />
            ) : (
              <XCircle className="h-7 w-7 text-red-500" />
            )}
          </div>
          <CardTitle>
            {status === "loading" ? "验证中..." : status === "success" ? "验证成功" : "验证失败"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-center">
          <p className="text-sm text-muted-foreground">{message}</p>
          {status === "success" && (
            <Button className="gap-1.5" onClick={() => router.push("/login")}>
              去登录 <ArrowRight className="h-4 w-4" />
            </Button>
          )}
          {status === "error" && (
            <div className="flex gap-2 justify-center">
              <Button variant="outline" onClick={() => router.push("/login")}>
                去登录
              </Button>
              <Button variant="ghost" onClick={() => router.push("/")}>
                返回首页
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    }>
      <VerifyContent />
    </Suspense>
  );
}
