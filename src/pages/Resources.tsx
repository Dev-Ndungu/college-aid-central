
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Download, Book, BookOpen, FileText, Video, Link2 } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

// Mock data for resources
const resources = [
  {
    id: 1,
    title: "How to Write a Research Paper",
    description: "A comprehensive guide to writing academic research papers.",
    category: "writing",
    type: "guide",
    downloadable: true,
    icon: <FileText className="h-8 w-8 text-brand-500" />,
  },
  {
    id: 2,
    title: "APA Citation Style Guide",
    description: "Learn how to properly cite sources using APA format.",
    category: "citation",
    type: "guide",
    downloadable: true,
    icon: <Book className="h-8 w-8 text-brand-500" />,
  },
  {
    id: 3,
    title: "MLA Format Template",
    description: "A template for creating documents in MLA format.",
    category: "citation",
    type: "template",
    downloadable: true,
    icon: <FileText className="h-8 w-8 text-brand-500" />,
  },
  {
    id: 4,
    title: "Essay Structure Overview",
    description: "Learn the basics of structuring academic essays.",
    category: "writing",
    type: "guide",
    downloadable: true,
    icon: <BookOpen className="h-8 w-8 text-brand-500" />,
  },
  {
    id: 5,
    title: "Critical Analysis Techniques",
    description: "Methods for developing critical analysis in academic work.",
    category: "analysis",
    type: "guide",
    downloadable: true,
    icon: <Book className="h-8 w-8 text-brand-500" />,
  },
  {
    id: 6,
    title: "Research Methods Overview",
    description: "Introduction to common research methods in academia.",
    category: "research",
    type: "video",
    downloadable: false,
    icon: <Video className="h-8 w-8 text-brand-500" />,
  },
  {
    id: 7,
    title: "Lab Report Template",
    description: "A template for writing scientific lab reports.",
    category: "science",
    type: "template",
    downloadable: true,
    icon: <FileText className="h-8 w-8 text-brand-500" />,
  },
  {
    id: 8,
    title: "Academic Writing Webinars",
    description: "Series of webinars on improving academic writing skills.",
    category: "writing",
    type: "video",
    downloadable: false,
    icon: <Video className="h-8 w-8 text-brand-500" />,
  },
  {
    id: 9,
    title: "Useful Academic Databases",
    description: "A list of valuable academic databases for research.",
    category: "research",
    type: "link",
    downloadable: false,
    icon: <Link2 className="h-8 w-8 text-brand-500" />,
  },
];

// Resource categories
const categories = [
  { id: "all", name: "All Resources" },
  { id: "writing", name: "Writing" },
  { id: "citation", name: "Citations" },
  { id: "research", name: "Research" },
  { id: "science", name: "Science" },
  { id: "analysis", name: "Analysis" },
];

// Resource types
const types = [
  { id: "all", name: "All Types" },
  { id: "guide", name: "Guides" },
  { id: "template", name: "Templates" },
  { id: "video", name: "Videos" },
  { id: "link", name: "Links" },
];

// ResourceCard component
const ResourceCard = ({ resource }: { resource: any }) => (
  <Card className="card-hover">
    <CardHeader className="pb-3">
      <div className="mb-3 flex justify-center">
        {resource.icon}
      </div>
      <CardTitle className="text-lg text-center">{resource.title}</CardTitle>
    </CardHeader>
    <CardContent>
      <p className="text-gray-600 text-sm mb-4">
        {resource.description}
      </p>
      <div className="flex justify-between items-center">
        <span className="text-xs bg-brand-100 text-brand-700 px-2 py-1 rounded-full">
          {resource.category.charAt(0).toUpperCase() + resource.category.slice(1)}
        </span>
        {resource.downloadable ? (
          <Button size="sm" variant="outline" className="h-8 gap-1">
            <Download className="h-3 w-3" />
            Download
          </Button>
        ) : (
          <Button size="sm" variant="outline" className="h-8">
            View
          </Button>
        )}
      </div>
    </CardContent>
  </Card>
);

const Resources = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [filteredResources, setFilteredResources] = useState(resources);

  // Filter resources based on search query and selected category
  React.useEffect(() => {
    let result = resources;

    if (searchQuery) {
      result = result.filter(resource => 
        resource.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        resource.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (selectedCategory !== 'all') {
      result = result.filter(resource => resource.category === selectedCategory);
    }

    setFilteredResources(result);
  }, [searchQuery, selectedCategory]);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow bg-gray-50 py-8 px-4">
        <div className="container mx-auto">
          <header className="mb-8">
            <h1 className="text-3xl font-bold">Resource Library</h1>
            <p className="text-gray-600">
              Browse our collection of helpful academic resources
            </p>
          </header>

          <div className="mb-8">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-grow">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="Search resources..."
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Button variant="outline" className="md:w-auto w-full">
                Advanced Search
              </Button>
            </div>
          </div>

          <Tabs defaultValue="all" onValueChange={setSelectedCategory} className="mb-8">
            <TabsList className="flex overflow-x-auto pb-1">
              {categories.map((category) => (
                <TabsTrigger 
                  key={category.id} 
                  value={category.id}
                  className="px-4"
                >
                  {category.name}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

          {filteredResources.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredResources.map((resource) => (
                <ResourceCard key={resource.id} resource={resource} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <h3 className="text-xl font-semibold mb-2">No resources found</h3>
              <p className="text-gray-600">
                Try adjusting your search or browse all categories
              </p>
              <Button 
                className="mt-4" 
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('all');
                }}
              >
                Show All Resources
              </Button>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Resources;
