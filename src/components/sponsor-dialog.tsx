"use client";

import { useState } from "react";
import {
  Heart, ArrowRight, Gift, ArrowLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

type PaymentMethod = "wechat" | "alipay" | null;

function WechatPayIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" fill="currentColor" className={className}>
      <path d="m5.82158951 10.2392289c-.07458706.0370453-.15730458.0556955-.24094809.054326-.19411036.0004044-.37251043-.1042744-.4634916-.2719605l-.03714687-.07248977-1.46459966-3.11854655c-.01512596-.03426189-.02150045-.07160842-.01857344-.10881723-.00173271-.06781637.02505287-.13335979.07410324-.18132817.04905038-.04796839.11607222-.07416311.18541829-.07246861.05991821.00135034.11803899.0202774.1668232.05432605l1.72429004 1.19665926c.13428814.07989516.287767.12369848.44491816.12698096.09540276-.00050307.18981611-.01894679.27809496-.05432605l8.08434026-3.51748802c-1.4654439-1.68625423-3.8570268-2.77409627-6.54544686-2.77409627-4.43111472 0-8.00937114 2.91907582-8.00937114 6.52721734 0 1.95821474 1.07540181 3.73512246 2.76254498 4.93244226.19798422.1234931.27637709.3683985.18573434.5802485-.12984519.4895949-.35221984 1.2879732-.35221984 1.3236402-.02294672.0641881-.03548063.1314925-.03714687.1994707-.00149457.0676161.0253489.1328891.07429838.1806653s.11574724.0738997.18488544.0723059c.05476156.0014409.10794137-.0180468.14824977-.0543261l1.74286348-.9975188c.12865107-.0773324.27545557-.1210562.42634473-.1269809.0814565.0032186.1622826.0154046.24094809.0363274.84921252.2423376 1.7294984.3646673 2.61412636.3632745 4.41254124 0 8.00937114-2.9190758 8.00937114-6.52721731-.0072077-1.07252838-.3219348-2.12157031-.9084098-3.02789305l-9.21428039 5.22141056z" />
    </svg>
  );
}

function AlipayIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 17 16" fill="none" className={className}>
      <path d="M10.476 9.115a78.809 78.809 0 006.061 2.084c1.121.46 0 3.07-1.184 2.531-1.34-.577-4.035-1.757-6.085-2.766C8.128 12.289 6.338 14 3.788 14 1.522 14 0 12.682 0 10.719c0-1.654 1.157-3.324 3.74-3.324 1.48 0 3 .415 4.818 1.04.336-.666.616-1.361.838-2.078l-6.57-.003V5.353l3.379.008V4.05H2.088v-.986l4.117.003V1.604c0-.383.208-.604.571-.604H8.5v2.073l4.08.003v.977H8.5V5.37l3.339.009s-.413 2.115-1.361 3.736zm-9.549 1.52v-.001c0 .94.741 1.89 2.545 1.89 1.393 0 2.757-.824 4.062-2.45-1.744-.862-2.679-1.277-4.03-1.277-1.312 0-2.577.631-2.577 1.839z" fill="currentColor" />
    </svg>
  );
}

function ScanPhoneIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 48 40"
      width="48"
      height="40"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path
        opacity=".6"
        fillRule="evenodd"
        clipRule="evenodd"
        d="M9 1a4 4 0 00-4 4v30a4 4 0 004 4h18a4 4 0 004-4v-9a1 1 0 10-2 0v9a2 2 0 01-2 2H9a2 2 0 01-2-2V14a2 2 0 012-2h18a2 2 0 012 2v2a1 1 0 102 0V5a4 4 0 00-4-4H9zm26.992 15.409L39.583 20H24a1 1 0 100 2h15.583l-3.591 3.591a1 1 0 101.415 1.416l5.3-5.3a1 1 0 000-1.414l-5.3-5.3a1 1 0 10-1.415 1.416zM7 8.5A1.5 1.5 0 018.5 7h19a1.5 1.5 0 010 3h-19A1.5 1.5 0 017 8.5zM23 3a1 1 0 100 2 1 1 0 000-2zm-8 1a1 1 0 011-1h4a1 1 0 110 2h-4a1 1 0 01-1-1zm0 30a1 1 0 100 2h6a1 1 0 100-2h-6z"
      />
    </svg>
  );
}

interface SponsorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function SponsorDialog({ open, onOpenChange }: SponsorDialogProps) {
  const [method, setMethod] = useState<PaymentMethod>(null);
  const [showQr, setShowQr] = useState(false);

  const toggleMethod = (m: PaymentMethod) => {
    setMethod((prev) => (prev === m ? null : m));
    setShowQr(false);
  };

  const handleClose = () => {
    setMethod(null);
    setShowQr(false);
    onOpenChange(false);
  };

  const paymentLabel = method === "wechat" ? "WeChat Pay" : "Alipay";
  const qrSrc = method === "wechat" ? "/wechat-pay-qr.png" : "/alipay-qr.png";

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md" showCloseButton>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-rose-500" />
            赞助我们
          </DialogTitle>
        </DialogHeader>

        <p className="text-sm text-muted-foreground leading-relaxed">
          如果你喜欢本站，欢迎请我们喝杯咖啡。你的每一份支持都是我们持续维护和优化的动力。
        </p>

        <p className="text-xs text-muted-foreground/60 leading-relaxed">
          所有档位无刷题特权、不解锁付费题目、提交次数无限制，平台全部功能免费开放。所有捐赠仅用于域名、CDN、服务器运维。
        </p>

        {/* 支付方式选择 */}
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => toggleMethod("wechat")}
            className={cn(
              "flex items-center gap-3 rounded-xl p-4 text-left transition-colors",
              method === "wechat"
                ? "bg-emerald-500/10"
                : "hover:bg-accent"
            )}
          >
            <WechatPayIcon className="h-6 w-6 text-emerald-500" />
            <span className="text-sm font-medium">WeChat Pay</span>
          </button>

          <button
            type="button"
            onClick={() => toggleMethod("alipay")}
            className={cn(
              "flex items-center gap-3 rounded-xl p-4 text-left transition-colors",
              method === "alipay"
                ? "bg-blue-500/10"
                : "hover:bg-accent"
            )}
          >
            <AlipayIcon className="h-6 w-6 text-blue-500" />
            <span className="text-sm font-medium">Alipay</span>
          </button>
        </div>

        {/* 展开的支付卡片 */}
        {method && !showQr && (
          <div className="rounded-xl border bg-muted/20 p-5 space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="flex justify-center text-muted-foreground">
              <ScanPhoneIcon className="h-10 w-auto" />
            </div>

            <p className="text-sm text-center text-muted-foreground">
              继续后，你将会看到一个 QR Code，请使用 {paymentLabel} 扫描。
            </p>

            <Button className="w-full gap-2" onClick={() => setShowQr(true)}>
              <Gift className="h-4 w-4" />
              继续
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* 二维码展示 */}
        {method && showQr && (
          <div className="rounded-xl border bg-muted/20 p-5 space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => setShowQr(false)}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              返回
            </button>

            <p className="text-sm text-center text-muted-foreground">
              请使用 {paymentLabel} 扫描二维码
            </p>

            <div className="flex justify-center">
              <img
                src={qrSrc}
                alt={`${paymentLabel} QR Code`}
                className="w-48 h-48 rounded-xl border object-contain bg-white"
              />
            </div>

            <p className="text-[10px] text-center text-muted-foreground">
              感谢你的支持！
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
