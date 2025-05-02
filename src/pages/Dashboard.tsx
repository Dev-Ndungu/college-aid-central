
import React from 'react';
import { Button } from "@/components/ui/button";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Plus, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  FileText, 
  Calendar 
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

// Mock data for assignments
const activeAssignments = [
  {
    id: 1,
    title: "Research Paper on Climate Change",
    subject: "Environmental Science",
    dueDate: "2025-06-01",
    status: "in-progress",
    progress: 60,
  },
  {
    id: 2,
    title: "Analysis of Shakespeare's Hamlet",
    subject: "English Literature",
    dueDate: "2025-05-15",
    status: "submitted",
    progress: 30,
  },
  {
    id: 3,
    title: "Statistical Analysis Project",
    subject: "Statistics",
    dueDate: "2025-05-20",
    status: "review",
    progress: 80,
  },
];

const completedAssignments = [
  {
    id: 4,
    title: "Economics Research Paper",
    subject: "Economics",
    completedDate: "2025-04-10",
    grade: "A",
  },
  {
    id: 5,
    title: "Biology Lab Report",
    subject: "Biology",
    completedDate: "2025-04-05",
    grade: "A-",
  },
];

// Get status color
const getStatusColor = (status: string) => {
  switch(status) {
    case 'submitted':
      return 'bg-blue-100 text-blue-800';
    case 'in-progress':
      return 'bg-yellow-100 text-yellow-800';
    case 'review':
      return 'bg-purple-100 text-purple-800';
    case 'completed':
      return 'bg-green-100 text-green-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

// Get status label
const getStatusLabel = (status: string) => {
  switch(status) {
    case 'submitted':
      return 'Submitted';
    case 'in-progress':
      return 'In Progress';
    case 'review':
      return 'Under Review';
    case 'completed':
      return 'Completed';
    default:
      return status;
  }
};

const Dashboard = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow bg-gray-50 py-8 px-4">
        <div className="container mx-auto">
          <header className="mb-8">
            <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
              <div>
                <h1 className="text-3xl font-bold">Dashboard</h1>
                <p className="text-gray-600">Manage your assignments and track progress</p>
              </div>
              <Button>
                <Plus className="mr-2 h-4 w-4" /> New Assignment
              </Button>
            </div>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center">
                  <Clock className="h-5 w-5 mr-2 text-yellow-500" />
                  Active Assignments
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{activeAssignments.length}</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center">
                  <CheckCircle className="h-5 w-5 mr-2 text-green-500" />
                  Completed
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{completedAssignments.length}</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center">
                  <AlertCircle className="h-5 w-5 mr-2 text-red-500" />
                  Upcoming Deadlines
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">2</p>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="active" className="mb-8">
            <TabsList>
              <TabsTrigger value="active">Active</TabsTrigger>
              <TabsTrigger value="completed">Completed</TabsTrigger>
              <TabsTrigger value="feedback">Feedback</TabsTrigger>
            </TabsList>
            
            <TabsContent value="active" className="mt-6">
              <div className="grid grid-cols-1 gap-6">
                {activeAssignments.map((assignment) => (
                  <Card key={assignment.id}>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle>{assignment.title}</CardTitle>
                          <CardDescription>{assignment.subject}</CardDescription>
                        </div>
                        <span 
                          className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(assignment.status)}`}
                        >
                          {getStatusLabel(assignment.status)}
                        </span>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="mb-4">
                        <div className="flex justify-between text-sm mb-1">
                          <span>Progress</span>
                          <span>{assignment.progress}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                          <div 
                            className="bg-brand-500 h-2.5 rounded-full" 
                            style={{ width: `${assignment.progress}%` }}
                          ></div>
                        </div>
                      </div>
                      <div className="flex items-center text-sm text-gray-500">
                        <Calendar className="h-4 w-4 mr-1" />
                        Due: {new Date(assignment.dueDate).toLocaleDateString()}
                      </div>
                    </CardContent>
                    <CardFooter className="border-t pt-4">
                      <Button variant="outline" size="sm" className="mr-2">
                        View Details
                      </Button>
                      <Button size="sm">
                        Track Progress
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            </TabsContent>
            
            <TabsContent value="completed" className="mt-6">
              <div className="grid grid-cols-1 gap-6">
                {completedAssignments.map((assignment) => (
                  <Card key={assignment.id}>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle>{assignment.title}</CardTitle>
                          <CardDescription>{assignment.subject}</CardDescription>
                        </div>
                        <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-medium">
                          Grade: {assignment.grade}
                        </span>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center text-sm text-gray-500">
                        <CheckCircle className="h-4 w-4 mr-1 text-green-500" />
                        Completed: {new Date(assignment.completedDate).toLocaleDateString()}
                      </div>
                    </CardContent>
                    <CardFooter className="border-t pt-4">
                      <Button variant="outline" size="sm">
                        View Assignment
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            </TabsContent>
            
            <TabsContent value="feedback" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Feedback</CardTitle>
                  <CardDescription>
                    View feedback for your completed assignments
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-center py-10 text-gray-500">
                    No feedback available yet
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Dashboard;
