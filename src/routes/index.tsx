import { createBrowserRouter } from 'react-router-dom';
import { RootLayout } from '@/components/layout';
import {
  LandingPage,
  InterviewSetupPage,
  InterviewPage,
  ReportPage,
  NotFoundPage,
} from '@/pages';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    children: [
      {
        index: true,
        element: <LandingPage />,
      },
      {
        path: 'setup',
        element: <InterviewSetupPage />,
      },
      {
        path: 'interview',
        element: <InterviewPage />,
      },
      {
        path: 'report',
        element: <ReportPage />,
      },
      {
        path: '*',
        element: <NotFoundPage />,
      },
    ],
  },
]);
