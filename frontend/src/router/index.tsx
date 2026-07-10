import { createBrowserRouter } from 'react-router-dom'
import AppLayout from '../components/AppLayout'
import Home from '../pages/Home'
import CreateResume from '../pages/CreateResume'
import Resume from '../pages/Resume'
import Optimize from '../pages/Optimize'
import Analyze from '../pages/Analyze'
import Export from '../pages/Export'
import Interview from '../pages/Interview'

const router = createBrowserRouter([
  {
    element: <AppLayout />,
    children: [
      { path: '/', element: <Home /> },
      { path: '/create', element: <CreateResume /> },
      { path: '/resume', element: <Resume /> },
      { path: '/optimize', element: <Optimize /> },
      { path: '/analyze', element: <Analyze /> },
      { path: '/interview', element: <Interview /> },
      { path: '/export', element: <Export /> },
    ],
  },
])

export default router
