import React from "react";
import { RouteObject } from "react-router-dom";
import ProtectedLayout from "@/layouts/ProtectedLayout";
import { useAuth } from "@/contexts/useAuth";

const Dashboard = React.lazy(() => import("@/pages/Dashboard"));
const LearnerDashboard = React.lazy(() => import("@/pages/LearnerDashboard"));
const Discover = React.lazy(() => import("@/pages/Discover"));
const Sessions = React.lazy(() => import("@/pages/Sessions"));
const Messages = React.lazy(() => import("@/pages/Messages"));
const Chat = React.lazy(() => import("@/pages/Chat"));
const Notifications = React.lazy(() => import("@/pages/Notifications"));
const Leaderboard = React.lazy(() => import("@/pages/Leaderboard"));
const ResourceHub = React.lazy(() => import("@/pages/ResourceHub"));
const Portfolio = React.lazy(() => import("@/pages/Portfolio"));
const PeerReviewDashboard = React.lazy(() => import("@/pages/PeerReviewDashboard"));
const SubmitForReview = React.lazy(() => import("@/pages/SubmitForReview"));
const ReviewSubmission = React.lazy(() => import("@/pages/ReviewSubmission"));
const MockInterview = React.lazy(() => import("@/pages/MockInterview"));
const AnonymousDoubts = React.lazy(() => import("@/pages/AnonymousDoubts"));
const ContributorDashboard = React.lazy(() => import("@/pages/ContributorDashboard"));
const AIPage = React.lazy(() => import("@/pages/aipage"));
const StudyRooms = React.lazy(() => import("@/components/StudyRooms"));
const Room = React.lazy(() => import("@/components/Room/Room"));

const MessagesRoute = () => {
  const { user } = useAuth();
  return <Messages user={user} />;
};

export const protectedRoutes: RouteObject[] = [
  {
    element: <ProtectedLayout />,
    children: [
      { path: "/dashboard", element: <Dashboard /> },
      { path: "/learner-dashboard", element: <LearnerDashboard /> },
      { path: "/discover", element: <Discover /> },
      { path: "/sessions", element: <Sessions /> },
      { path: "/messages", element: <MessagesRoute /> },
      { path: "/chat", element: <Chat /> },
      { path: "/notifications", element: <Notifications /> },
      { path: "/leaderboard", element: <Leaderboard /> },
      { path: "/resources", element: <ResourceHub /> },
      { path: "/portfolio", element: <Portfolio /> },
      { path: "/peer-review", element: <PeerReviewDashboard /> },
      { path: "/peer-review/new", element: <SubmitForReview /> },
      { path: "/peer-review/:id", element: <ReviewSubmission /> },
      { path: "/mock-interview", element: <MockInterview /> },
      { path: "/anonymous-doubts", element: <AnonymousDoubts /> },
      { path: "/contributor-dashboard", element: <ContributorDashboard /> },
      { path: "/ai", element: <AIPage /> },
      { path: "/rooms", element: <StudyRooms /> },
      { path: "/rooms/:id", element: <Room /> },
    ],
  },
];
