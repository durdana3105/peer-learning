import React, { useEffect, useState } from "react";

interface Partner {
  _id: string;
  name: string;
  email: string;
  skills: string[];
  interests: string[];
  compatibilityScore: number;
}

const SuggestedPartners = () => {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPartners = async () => {
      try {
        const response = await fetch(
          "http://localhost:5000/api/match/recommendations",
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );

        const data = await response.json();

        if (data.success) {
          setPartners(data.recommendations);
        }
      } catch (error) {
        console.error("Error fetching partners:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPartners();
  }, []);

  if (loading) {
    return (
    <div className="text-center text-gray-400">
    Loading study partners...
    </div>
    );
  }

  return (
    <div className="mt-8">
      <h2 className="text-2xl font-bold mb-6">
        Suggested Study Partners
      </h2>

      <div className="grid gap-4 md:grid-cols-2">
        {partners.map((partner) => (
          <div
            key={partner._id}
            className="bg-[#1a1a1a] border border-gray-700 rounded-xl p-5 shadow-md"
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xl font-semibold text-white">
                {partner.name}
              </h3>

              <span className="bg-purple-600 text-white text-sm px-3 py-1 rounded-full">
                {partner.compatibilityScore}% Match
              </span>
            </div>

            <p className="text-sm text-gray-400 mb-2">
              {partner.email}
            </p>

            <div className="mb-3">
              <h4 className="font-medium text-white mb-1">
                Skills
              </h4>

              <div className="flex flex-wrap gap-2">
                {partner.skills?.map((skill, index) => (
                  <span
                    key={index}
                    className="bg-blue-600 text-white text-xs px-2 py-1 rounded-md"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            <div className="mb-4">
              <h4 className="font-medium text-white mb-1">
                Interests
              </h4>

              <div className="flex flex-wrap gap-2">
                {partner.interests?.map((interest, index) => (
                  <span
                    key={index}
                    className="bg-green-600 text-white text-xs px-2 py-1 rounded-md"
                  >
                    {interest}
                  </span>
                ))}
              </div>
            </div>

            <button className="w-full bg-purple-600 hover:bg-purple-700 transition-colors text-white py-2 rounded-lg">
              Connect
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SuggestedPartners;