import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  defaultCategoryPreferences,
  useCookieConsent,
} from "@/contexts/CookieConsentContext";
import type { CookieCategoryPreferences } from "@/lib/cookieConsent";
import { cn } from "@/lib/utils";

const categoryLabels: Record<
  keyof CookieCategoryPreferences | "essential",
  { title: string; description: string }
> = {
  essential: {
    title: "Essential Cookies",
    description: "Required for authentication, security, and core site functionality.",
  },
  analytics: {
    title: "Analytics Cookies",
    description: "Help us understand how visitors use PeerLearn to improve the platform.",
  },
  functional: {
    title: "Functional Cookies",
    description: "Remember your theme, role mode, and other preferences.",
  },
  marketing: {
    title: "Marketing Cookies",
    description: "Used to deliver relevant promotions if we introduce them in the future.",
  },
};

export default function CookieConsentBanner() {
  const {
    showBanner,
    preferences,
    acceptAll,
    rejectNonEssential,
    saveCustomPreferences,
    closeBanner,
  } = useCookieConsent();

  const [customizeOpen, setCustomizeOpen] = useState(false);
  const [draftPreferences, setDraftPreferences] = useState<CookieCategoryPreferences>(
    defaultCategoryPreferences(),
  );

  useEffect(() => {
    if (customizeOpen) {
      setDraftPreferences({
        analytics: preferences?.analytics ?? false,
        functional: preferences?.functional ?? false,
        marketing: preferences?.marketing ?? false,
      });
    }
  }, [customizeOpen, preferences]);

  if (!showBanner) {
    return null;
  }

  const handleSaveCustom = () => {
    saveCustomPreferences(draftPreferences);
    setCustomizeOpen(false);
  };

  const handleCustomizeCancel = () => {
    setCustomizeOpen(false);
    if (preferences?.consentGiven) {
      closeBanner();
    }
  };

  return (
    <>
      <div
        role="region"
        aria-label="Cookie consent"
        className="fixed inset-x-0 bottom-0 z-[100] border-t border-white/10 bg-[#020617]/95 p-4 shadow-2xl backdrop-blur-xl sm:p-6"
      >
        <div className="mx-auto flex max-w-6xl flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex-1 space-y-2">
            <p className="text-sm font-semibold text-white sm:text-base">
              We use cookies to improve your experience
            </p>
            <p className="text-sm leading-relaxed text-slate-300">
              PeerLearn uses cookies and similar technologies to keep you signed in,
              remember your preferences, and understand how our platform is used. You
              can accept all cookies, reject non-essential cookies, or customize your
              choices. Read our{" "}
              <Link
                to="/cookies-policy"
                className="font-medium text-cyan-400 underline-offset-4 hover:text-cyan-300 hover:underline"
              >
                Cookies Policy
              </Link>{" "}
              for more details.
            </p>
          </div>

          <div className="flex w-full flex-col gap-2 sm:flex-row sm:flex-wrap lg:w-auto lg:justify-end">
            <Button
              type="button"
              variant="outline"
              className="border-white/20 bg-transparent text-white hover:bg-white/10 hover:text-white"
              onClick={rejectNonEssential}
            >
              Reject Non-Essential
            </Button>
            <Button
              type="button"
              variant="outline"
              className="border-cyan-400/40 bg-transparent text-cyan-300 hover:bg-cyan-400/10 hover:text-cyan-200"
              onClick={() => setCustomizeOpen(true)}
            >
              Customize Preferences
            </Button>
            <Button
              type="button"
              className="bg-gradient-to-r from-cyan-400 to-blue-500 font-semibold text-black hover:from-cyan-300 hover:to-blue-400"
              onClick={acceptAll}
            >
              Accept All
            </Button>
          </div>
        </div>
      </div>

      <Dialog
        open={customizeOpen}
        onOpenChange={(open) => {
          setCustomizeOpen(open);
          if (!open && preferences?.consentGiven) {
            closeBanner();
          }
        }}
      >
        <DialogContent className="max-w-lg border-white/10 bg-[#071127] text-white sm:rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl text-cyan-300">
              Cookie Preferences
            </DialogTitle>
            <DialogDescription className="text-slate-300">
              Choose which optional cookie categories you allow. Essential cookies
              cannot be disabled because they are required for the site to work.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <PreferenceRow
              id="essential-cookies"
              title={categoryLabels.essential.title}
              description={categoryLabels.essential.description}
              checked
              disabled
            />

            <PreferenceRow
              id="analytics-cookies"
              title={categoryLabels.analytics.title}
              description={categoryLabels.analytics.description}
              checked={draftPreferences.analytics}
              onCheckedChange={(checked) =>
                setDraftPreferences((prev) => ({ ...prev, analytics: checked }))
              }
            />

            <PreferenceRow
              id="functional-cookies"
              title={categoryLabels.functional.title}
              description={categoryLabels.functional.description}
              checked={draftPreferences.functional}
              onCheckedChange={(checked) =>
                setDraftPreferences((prev) => ({ ...prev, functional: checked }))
              }
            />

            <PreferenceRow
              id="marketing-cookies"
              title={categoryLabels.marketing.title}
              description={categoryLabels.marketing.description}
              checked={draftPreferences.marketing}
              onCheckedChange={(checked) =>
                setDraftPreferences((prev) => ({ ...prev, marketing: checked }))
              }
            />
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              className="border-white/20 bg-transparent text-white hover:bg-white/10 hover:text-white"
              onClick={handleCustomizeCancel}
            >
              Cancel
            </Button>
            <Button
              type="button"
              className="bg-gradient-to-r from-cyan-400 to-blue-500 font-semibold text-black hover:from-cyan-300 hover:to-blue-400"
              onClick={handleSaveCustom}
            >
              Save Preferences
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function PreferenceRow({
  id,
  title,
  description,
  checked,
  disabled = false,
  onCheckedChange,
}: {
  id: string;
  title: string;
  description: string;
  checked: boolean;
  disabled?: boolean;
  onCheckedChange?: (checked: boolean) => void;
}) {
  return (
    <div
      className={cn(
        "flex items-start justify-between gap-4 rounded-xl border border-white/10 bg-white/5 p-4",
        disabled && "opacity-80",
      )}
    >
      <div className="space-y-1">
        <Label htmlFor={id} className="text-sm font-semibold text-white">
          {title}
        </Label>
        <p className="text-sm leading-relaxed text-slate-300">{description}</p>
      </div>
      <Switch
        id={id}
        checked={checked}
        disabled={disabled}
        onCheckedChange={onCheckedChange}
        aria-readonly={disabled}
      />
    </div>
  );
}
