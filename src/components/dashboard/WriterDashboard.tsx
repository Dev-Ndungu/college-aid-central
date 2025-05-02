
import React from 'react';
import { Button } from "@/components/ui/button";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardDescription,
  CardFooter
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Clock, 
  CheckCircle, 
  FileText, 
  Calendar,
  UserCheck,
  Briefcase 
} from 'lucide-react';

// Mock data for writer assignments
const availableAssignments = [
  {
    id: 1,
    title: "Research Paper on Climate Change",
    subject: "Environmental Science",
    dueDate: "2025-06-01",
    budget: "$120",
    complexity: "Medium",
    wordCount: 2000,
  },
  {
    id: 2,
    title: "Analysis of Shakespeare's Hamlet",
    subject: "English Literature",
    dueDate: "2025-05-15",
    budget: "$85",
    complexity: "Medium",
    wordCount: 1500,
  },
  {
    id: 3,
    title: "Statistical Analysis Project",
    subject: "Statistics",
    dueDate: "2025-05-20",
    budget: "$150",
    complexity: "High",
    wordCount: 2500,
  },
];

const currentAssignments = [
  {
    id: 4,
    title: "Psychology Research Methods Essay",
    subject: "Psychology",
    dueDate: "2025-05-10",
    status: "in-progress",
    progress: 40,
    budget: "$110",
  },
  {
    id: 5,
    title: "Marketing Strategy Analysis",
    subject: "Business",
    dueDate: "2025-05-18",
    status: "in-progress",
    progress: 75,
    budget: "$130",
  },
];

const completedAssignments = [
  {
    id: 6,
    title: "Economics Research Paper",
    subject: "Economics",
    completedDate: "2025-04-10",
    rating: 5,
    budget: "$95",
  },
  {
    id: 7,
    title: "Biology Lab Report",
    subject: "Biology",
    completedDate: "2025-04-05",
    rating: 4,
    budget: "$80",
  },
];

const renderStars = (rating: number) => {
  return Array(5)
    .fill(0)
    .map((_, i) => (
      <svg
        key={i}
        className={`w-4 h-4 ${i < rating ? 'text-yellow-400' : 'text-gray-300'}`}
        aria-hidden="true"
        xmlns="http://www.w3.org/2000/svg"
        fill="currentColor"
        viewBox="0 0 22 20"
      >
        <path d="M20.924 7.625a1.523 1.523 0 0 0-1.238-1.044l-5.051-.734-2.259-4.577a1.534 1.534 0 0 0-2.752 0L7.365 5.847l-5.051.734A1.535 1.535 0 0 0 1.463 9.2l3.656 3.563-.863 5.031a1.532 1.532 0 0 0 2.226 1.616L11 17.033l4.518 2.375a1.534 1.534 0 0 0 2.226-1.617l-.863-5.03L20.537 9.2a1.523 1.523 0 0 0 .387-1.575Z" />
      </svg>
    ));
};

const WriterDashboard = () => {
  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center">
              <Briefcase className="h-5 w-5 mr-2 text-blue-500" />
              Available Jobs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{availableAssignments.length}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center">
              <Clock className="h-5 w-5 mr-2 text-yellow-500" />
              Current Jobs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{currentAssignments.length}</p>
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
      </div>

      <Tabs defaultValue="available" className="mb-8">
        <TabsList>
          <TabsTrigger value="available">Available Jobs</TabsTrigger>
          <TabsTrigger value="current">Current Jobs</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
        </TabsList>
        
        <TabsContent value="available" className="mt-6">
          <div className="grid grid-cols-1 gap-6">
            {availableAssignments.map((assignment) => (
              <Card key={assignment.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle>{assignment.title}</CardTitle>
                      <CardDescription>{assignment.subject}</CardDescription>
                    </div>
                    <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-medium">
                      {assignment.budget}
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-4">
                    <div className="flex items-center text-sm">
                      <Calendar className="h-4 w-4 mr-1 text-gray-500" />
                      <span className="text-gray-700">Due: {new Date(assignment.dueDate).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center text-sm">
                      <FileText className="h-4 w-4 mr-1 text-gray-500" />
                      <span className="text-gray-700">Words: {assignment.wordCount}</span>
                    </div>
                    <div className="flex items-center text-sm">
                      <Clock className="h-4 w-4 mr-1 text-gray-500" />
                      <span className="text-gray-700">Complexity: {assignment.complexity}</span>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="border-t pt-4">
                  <Button variant="outline" size="sm" className="mr-2">
                    View Details
                  </Button>
                  <Button size="sm">
                    Apply for Job
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </TabsContent>
        
        <TabsContent value="current" className="mt-6">
          <div className="grid grid-cols-1 gap-6">
            {currentAssignments.map((assignment) => (
              <Card key={assignment.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle>{assignment.title}</CardTitle>
                      <CardDescription>{assignment.subject}</CardDescription>
                    </div>
                    <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-medium">
                      {assignment.budget}
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
                    Update Progress
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
                      {assignment.budget}
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col space-y-2">
                    <div className="flex items-center text-sm text-gray-500">
                      <CheckCircle className="h-4 w-4 mr-1 text-green-500" />
                      Completed: {new Date(assignment.completedDate).toLocaleDateString()}
                    </div>
                    <div className="flex items-center">
                      <span className="text-sm text-gray-500 mr-2">Client Rating:</span>
                      <div className="flex items-center">
                        {renderStars(assignment.rating)}
                      </div>
                    </div>
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
      </Tabs>
    </>
  );
};

export default WriterDashboard;
