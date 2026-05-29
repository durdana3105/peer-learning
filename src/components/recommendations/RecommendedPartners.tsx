import { Users } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Partner = {
  _id: string;
  name: string;
  skills: string[];
  compatibilityScore: number;
  reason: string;
};

type RecommendedPartnersProps = {
  partners: Partner[];
};

const RecommendedPartners = ({
  partners,
}: RecommendedPartnersProps) => {
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
          partners.map((partner) => (
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

                <Badge className="bg-cyan-400/10 text-cyan-200">
                  {partner.compatibilityScore}% Match
                </Badge>
              </div>
            </div>
          ))
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