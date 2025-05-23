
import React, { useState } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useNavigate } from 'react-router-dom';
import { Edit2, Clock, CheckCircle, Mail, BookOpen, DollarSign } from "lucide-react";
import { Assignment, useAssignments } from '@/hooks/useAssignments';
import { useIsMobile } from '@/hooks/use-mobile';

const StudentDashboard = () => {
  const { activeAssignments, completedAssignments, isLoading } = useAssignments();
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const handleEmailSupport = () => {
    window.location.href = "mailto:inquiries@assignmenthub.org?subject=Assignment Support Request";
  };

  const handleEditAssignment = (id: string) => {
    navigate(`/edit-assignment/${id}`);
  };

  const ActiveAssignments = () => {
    if (activeAssignments.length === 0) {
      return (
        <div className="text-center py-12">
          <div className="mx-auto bg-gray-100 rounded-full p-4 w-16 h-16 flex items-center justify-center mb-4">
            <BookOpen className="h-8 w-8 text-gray-500" />
          </div>
          <h3 className="text-lg font-medium">No Active Assignments</h3>
          <p className="text-gray-500 max-w-sm mx-auto mt-1">
            You haven't submitted any assignments yet. Click the "New Assignment" button to get started.
          </p>
          <Button onClick={() => navigate('/submit-assignment')} className="mt-4">
            Submit New Assignment
          </Button>
        </div>
      );
    }

    if (isMobile) {
      return (
        <div className="space-y-4">
          {activeAssignments.map(assignment => (
            <div key={assignment.id} className="bg-white p-4 rounded-lg shadow-sm border">
              <div className="mb-2">
                <h3 className="font-medium">{assignment.title}</h3>
                {assignment.description && (
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                    {assignment.description}
                  </p>
                )}
              </div>
              <div className="flex justify-between items-center text-sm">
                <div>
                  <p className="text-gray-500">Subject: {assignment.subject}</p>
                  <p className="text-gray-500">
                    Due: {assignment.due_date ? 
                      new Date(assignment.due_date).toLocaleDateString() : 
                      'Not set'
                    }
                  </p>
                  {assignment.price !== null && assignment.price !== undefined && (
                    <p className="text-gray-500 flex items-center">
                      <DollarSign className="h-3 w-3 mr-1" />
                      Price: ${assignment.price}
                    </p>
                  )}
                </div>
                <div className="flex flex-col gap-2 items-end">
                  <AssignmentStatusBadge status={assignment.status} />
                  {assignment.status === 'submitted' && !assignment.writer_id && (
                    <Button 
                      variant="ghost" 
                      size="sm"
                      className="h-8"
                      onClick={() => handleEditAssignment(assignment.id)}
                    >
                      <Edit2 className="h-4 w-4 mr-1" /> Edit
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <div className="overflow-auto">
          <table className="w-full min-w-[800px] text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="p-3 text-left font-medium">Assignment</th>
                <th className="p-3 text-left font-medium">Subject</th>
                <th className="p-3 text-left font-medium">Status</th>
                <th className="p-3 text-left font-medium">Due Date</th>
                <th className="p-3 text-left font-medium">Price</th>
                <th className="p-3 text-left font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {activeAssignments.map(assignment => (
                <tr key={assignment.id} className="border-b">
                  <td className="p-3">
                    <div className="font-medium">{assignment.title}</div>
                    {assignment.description && (
                      <div className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {assignment.description}
                      </div>
                    )}
                  </td>
                  <td className="p-3">{assignment.subject}</td>
                  <td className="p-3">
                    <AssignmentStatusBadge status={assignment.status} />
                  </td>
                  <td className="p-3">
                    {assignment.due_date ? 
                      new Date(assignment.due_date).toLocaleDateString() : 
                      'Not set'
                    }
                  </td>
                  <td className="p-3">
                    {assignment.price !== null && assignment.price !== undefined ? 
                      `$${assignment.price}` : 
                      'Not set'
                    }
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      {/* Only allow editing if the assignment is still in submitted status */}
                      {assignment.status === 'submitted' && !assignment.writer_id && (
                        <Button 
                          variant="ghost" 
                          size="icon"
                          className="h-8 w-8" 
                          onClick={() => handleEditAssignment(assignment.id)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const CompletedAssignments = () => {
    if (completedAssignments.length === 0) {
      return (
        <div className="text-center py-12">
          <div className="mx-auto bg-gray-100 rounded-full p-4 w-16 h-16 flex items-center justify-center mb-4">
            <CheckCircle className="h-8 w-8 text-gray-500" />
          </div>
          <h3 className="text-lg font-medium">No Completed Assignments</h3>
          <p className="text-gray-500 max-w-sm mx-auto mt-1">
            You don't have any completed assignments yet.
          </p>
        </div>
      );
    }

    if (isMobile) {
      return (
        <div className="space-y-4">
          {completedAssignments.map(assignment => (
            <div key={assignment.id} className="bg-white p-4 rounded-lg shadow-sm border">
              <div className="mb-2">
                <h3 className="font-medium">{assignment.title}</h3>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <p className="text-gray-500">Subject: {assignment.subject}</p>
                <p className="text-gray-500 text-right">
                  Grade: {assignment.grade || 'Not graded'}
                </p>
                <p className="text-gray-500">
                  Completed: {assignment.completed_date ? 
                    new Date(assignment.completed_date).toLocaleDateString() : 
                    'N/A'
                  }
                </p>
                <p className="text-gray-500 text-right">
                  Price: {assignment.price !== null && assignment.price !== undefined ? 
                    `$${assignment.price}` : 
                    'Not set'}
                </p>
              </div>
            </div>
          ))}
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <div className="overflow-auto">
          <table className="w-full min-w-[800px] text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="p-3 text-left font-medium">Assignment</th>
                <th className="p-3 text-left font-medium">Subject</th>
                <th className="p-3 text-left font-medium">Completed Date</th>
                <th className="p-3 text-left font-medium">Grade</th>
                <th className="p-3 text-left font-medium">Price</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {completedAssignments.map(assignment => (
                <tr key={assignment.id} className="border-b">
                  <td className="p-3">
                    <div className="font-medium">{assignment.title}</div>
                  </td>
                  <td className="p-3">{assignment.subject}</td>
                  <td className="p-3">
                    {assignment.completed_date ? 
                      new Date(assignment.completed_date).toLocaleDateString() : 
                      'N/A'
                    }
                  </td>
                  <td className="p-3">{assignment.grade || 'Not graded'}</td>
                  <td className="p-3">
                    {assignment.price !== null && assignment.price !== undefined ? 
                      `$${assignment.price}` : 
                      'Not set'
                    }
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Email Support Button - Right aligned on desktop, full-width on mobile */}
      <div className={`flex ${isMobile ? 'justify-center px-4' : 'justify-end'}`}>
        <Button 
          variant="outline" 
          onClick={handleEmailSupport}
          className={`gap-2 ${isMobile ? 'w-full' : ''}`}
        >
          <Mail className="h-4 w-4" />
          Email Support
        </Button>
      </div>

      <Tabs defaultValue="active" className="w-full">
        <TabsList className={`grid grid-cols-2 mb-4 md:mb-8 ${isMobile ? 'mx-4' : ''}`}>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
        </TabsList>
        
        <TabsContent value="active" className="w-full">
          <Card className={isMobile ? 'rounded-none border-x-0 shadow-none' : ''}>
            <CardHeader className={`pb-4 ${isMobile ? 'px-4' : ''}`}>
              <CardTitle>Active Assignments</CardTitle>
              <CardDescription>
                Assignments that are in progress or awaiting a writer.
              </CardDescription>
            </CardHeader>
            <CardContent className={isMobile ? 'px-4' : ''}>
              {isLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  <p className="mt-2 text-sm text-gray-500">Loading assignments...</p>
                </div>
              ) : (
                <ActiveAssignments />
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="completed" className="w-full">
          <Card className={isMobile ? 'rounded-none border-x-0 shadow-none' : ''}>
            <CardHeader className={`pb-4 ${isMobile ? 'px-4' : ''}`}>
              <CardTitle>Completed Assignments</CardTitle>
              <CardDescription>
                Assignments that have been completed by writers.
              </CardDescription>
            </CardHeader>
            <CardContent className={isMobile ? 'px-4' : ''}>
              {isLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  <p className="mt-2 text-sm text-gray-500">Loading assignments...</p>
                </div>
              ) : (
                <CompletedAssignments />
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

const AssignmentStatusBadge = ({ status }: { status: string }) => {
  switch (status) {
    case 'submitted':
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-amber-100 text-amber-800">
          <Clock className="mr-1 h-3 w-3" /> Submitted
        </span>
      );
    case 'in_progress':
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-blue-100 text-blue-800">
          <Clock className="mr-1 h-3 w-3" /> In Progress
        </span>
      );
    case 'completed':
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-green-100 text-green-800">
          <CheckCircle className="mr-1 h-3 w-3" /> Completed
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-gray-100 text-gray-800">
          {status}
        </span>
      );
  }
};

export default StudentDashboard;
