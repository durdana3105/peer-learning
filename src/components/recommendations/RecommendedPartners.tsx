import { Check, Clock, Loader2, UserPlus, Users } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useState } from "react";

type Partner = {
  _id: string;
  name: string;
  skills: string[];
  compatibilityScore: number;
  reason: string;
};

type RecommendedPartnersProps = {
  partners: Partner[];
  connectionStatuses?: Record<string, "pending" | "accepted" | "rejected">;
  onConnect?: (partnerId: string) => Promise<void>;
};

const RecommendedPartners = ({
  partners,
  connectionStatuses = {},
  onConnect,
}: RecommendedPartnersProps) => {
  const [loadingPartnerIds, setLoadingPartnerIds] = useState<Set<string>>(
    new Set(),
  );

  const handleConnect = async (partnerId: string) => {
    if (!onConnect || loadingPartnerIds.has(partnerId)) return;

    setLoadingPartnerIds((prev) => new Set(prev).add(partnerId));
    try {
      await onConnect(partnerId);
    } finally {
      setLoadingPartnerIds((prev) => {
        const next = new Set(prev);
        next.delete(partnerId);
        return next;
      });
    }
  };

  const getButtonState = (partnerId: string) => {
    const isLoading = loadingPartnerIds.has(partnerId);
    const status = connectionStatuses[partnerId];

    if (isLoading) {
      return {
        disabled: true,
        icon: <Loader2 className="h-4 w-4 animate-spin" />,
        label: "Connecting",
      };
    }

    if (status === "accepted") {
      return {
        disabled: true,
        icon: <Check className="h-4 w-4" />,
        label: "Connected",
      };
    }

    if (status === "pending") {
      return {
        disabled: true,
        icon: <Clock className="h-4 w-4" />,
        label: "Pending",
      };
    }

    if (status === "rejected") {
      return {
        disabled: true,
        icon: <Clock className="h-4 w-4" />,
        label: "Unavailable",
      };
    }

    return {
      disabled: !onConnect,
      icon: <UserPlus className="h-4 w-4" />,
      label: "Connect",
    };
  };

  return (
    <Card className="border-white/10 bg-white/5">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg text-white">
          <Users className="h-5 w-5 text-cyan-300" />
          Recommended Learning Partners
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {partners.length > 0 ? (
          partners.map((partner) => {
            const buttonState = getButtonState(partner._id);

            return (
              <div
                key={partner._id}
                className="rounded-2xl border border-white/10 bg-slate-950/40 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-3">
                    <div>
                      <h3 className="font-semibold text-white">
                        {partner.name}
                      </h3>

                      <p className="mt-1 text-sm text-slate-300">
                        {partner.reason}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {partner.skills.slice(0, 4).map((skill) => (
                        <Badge
                          key={skill}
                          variant="outline"
                          className="border-cyan-400/20 bg-cyan-400/10 text-cyan-200"
                        >
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <Badge className="shrink-0 bg-cyan-400/10 text-cyan-200">
                    {partner.compatibilityScore}% Match
                  </Badge>
                </div>

                <Button
                  type="button"
                  onClick={() => handleConnect(partner._id)}
                  disabled={buttonState.disabled}
                  className="mt-4 w-full rounded-2xl bg-gradient-to-r from-cyan-400 to-blue-500 font-semibold text-slate-950 hover:from-cyan-300 hover:to-blue-400 disabled:cursor-not-allowed disabled:bg-none disabled:bg-white/10 disabled:text-slate-400"
                >
                  {buttonState.icon}
                  {buttonState.label}
                </Button>
              </div>
            );
          })
        ) : (
          <p className="rounded-2xl border border-dashed border-white/10 px-4 py-8 text-sm text-slate-400">
            No learning partner recommendations available yet.
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default RecommendedPartners;
