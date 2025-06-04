
import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FileText, Upload, Loader2, MessageCircle, X, File } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { pdfService } from '@/services/pdfService';

interface ChatPDFToolProps {
  onSendToChat: (message: string) => void;
}

interface ProcessedPDF {
  id: string;
  name: string;
  totalPages: number;
  createdAt: Date;
}

interface ChatMessage {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export const ChatPDFTool: React.FC<ChatPDFToolProps> = ({ onSendToChat }) => {
  const [uploading, setUploading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [currentPDF, setCurrentPDF] = useState<ProcessedPDF | null>(null);
  const [question, setQuestion] = useState('');
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [loadingAnswer, setLoadingAnswer] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      toast({
        title: "Error",
        description: "Please upload a valid PDF file",
        variant: "destructive"
      });
      return;
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      toast({
        title: "Error",
        description: "File size must be less than 10MB",
        variant: "destructive"
      });
      return;
    }

    setUploading(true);
    setProcessing(true);

    try {
      console.log('Processing PDF:', file.name);
      const processedPDF = await pdfService.processPDF(file);
      
      setCurrentPDF({
        id: processedPDF.id,
        name: processedPDF.name,
        totalPages: processedPDF.totalPages,
        createdAt: processedPDF.createdAt
      });

      setChatHistory([]);
      
      toast({
        title: "Success",
        description: `PDF "${file.name}" processed successfully! You can now ask questions about it.`
      });

      // Send confirmation to main chat
      onSendToChat(`📄 **PDF Uploaded**: "${file.name}" (${processedPDF.totalPages} pages) is now ready for analysis. Ask me anything about this document!`);

    } catch (error) {
      console.error('PDF processing error:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to process PDF",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
      setProcessing(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleAskQuestion = async () => {
    if (!question.trim() || !currentPDF) {
      toast({
        title: "Error",
        description: currentPDF ? "Please enter a question" : "Please upload a PDF first",
        variant: "destructive"
      });
      return;
    }

    const userMessage: ChatMessage = {
      id: `msg_${Date.now()}`,
      type: 'user',
      content: question.trim(),
      timestamp: new Date()
    };

    setChatHistory(prev => [...prev, userMessage]);
    setLoadingAnswer(true);
    const currentQuestion = question.trim();
    setQuestion('');

    try {
      console.log('Asking question:', currentQuestion);
      const answer = await pdfService.answerQuestion(currentPDF.id, currentQuestion);
      
      const assistantMessage: ChatMessage = {
        id: `msg_${Date.now()}_response`,
        type: 'assistant',
        content: answer,
        timestamp: new Date()
      };

      setChatHistory(prev => [...prev, assistantMessage]);

      // Send to main chat as well
      onSendToChat(`**Q:** ${currentQuestion}\n\n**A:** ${answer}\n\n*Source: ${currentPDF.name}*`);

    } catch (error) {
      console.error('Question answering error:', error);
      const errorMessage: ChatMessage = {
        id: `msg_${Date.now()}_error`,
        type: 'assistant',
        content: "I'm sorry, I encountered an error while processing your question. Please try again.",
        timestamp: new Date()
      };
      
      setChatHistory(prev => [...prev, errorMessage]);
      
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to answer question",
        variant: "destructive"
      });
    } finally {
      setLoadingAnswer(false);
    }
  };

  const handleRemovePDF = () => {
    if (currentPDF) {
      pdfService.removePDF(currentPDF.id);
      setCurrentPDF(null);
      setChatHistory([]);
      toast({
        title: "Success",
        description: "PDF removed successfully"
      });
    }
  };

  const quickQuestions = [
    "Summarize the main points",
    "What are the key conclusions?",
    "List the important findings",
    "What methodology was used?",
    "What are the limitations mentioned?"
  ];

  return (
    <Card className="w-full h-full flex flex-col">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          ChatPDF
        </CardTitle>
        <CardDescription>
          Upload PDF documents and have AI-powered conversations about their content
        </CardDescription>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col space-y-4">
        {/* File Upload Section */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf"
              onChange={handleFileUpload}
              className="hidden"
              disabled={uploading}
            />
            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading || processing}
              className="flex-1"
            >
              {uploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload PDF
                </>
              )}
            </Button>
          </div>

          {processing && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted p-3 rounded-lg">
              <Loader2 className="h-4 w-4 animate-spin" />
              Processing PDF... This may take a moment for large documents.
            </div>
          )}
        </div>

        {/* Current PDF Info */}
        {currentPDF && (
          <div className="flex items-center justify-between p-3 bg-primary/10 rounded-lg">
            <div className="flex items-center gap-2">
              <File className="h-4 w-4 text-primary" />
              <div>
                <p className="font-medium text-sm">{currentPDF.name}</p>
                <p className="text-xs text-muted-foreground">
                  {currentPDF.totalPages} pages • Uploaded {currentPDF.createdAt.toLocaleTimeString()}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRemovePDF}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Quick Questions */}
        {currentPDF && chatHistory.length === 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">Quick questions:</p>
            <div className="flex flex-wrap gap-2">
              {quickQuestions.map((q, index) => (
                <Badge
                  key={index}
                  variant="secondary"
                  className="cursor-pointer hover:bg-primary hover:text-primary-foreground"
                  onClick={() => setQuestion(q)}
                >
                  {q}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Chat History */}
        {chatHistory.length > 0 && (
          <div className="flex-1 min-h-0">
            <ScrollArea className="h-48 border rounded-lg p-3">
              <div className="space-y-3">
                {chatHistory.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg p-3 text-sm ${
                        message.type === 'user'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted'
                      }`}
                    >
                      <p className="whitespace-pre-wrap">{message.content}</p>
                      <p className="text-xs opacity-70 mt-1">
                        {message.timestamp.toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))}
                {loadingAnswer && (
                  <div className="flex justify-start">
                    <div className="bg-muted rounded-lg p-3 text-sm">
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Analyzing document...
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        )}

        {/* Question Input */}
        <div className="flex gap-2">
          <Input
            placeholder={currentPDF ? "Ask a question about the PDF..." : "Upload a PDF first"}
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            disabled={!currentPDF || loadingAnswer}
            onKeyPress={(e) => e.key === 'Enter' && !loadingAnswer && handleAskQuestion()}
          />
          <Button
            onClick={handleAskQuestion}
            disabled={!currentPDF || !question.trim() || loadingAnswer}
          >
            {loadingAnswer ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <MessageCircle className="h-4 w-4" />
            )}
          </Button>
        </div>

        {!currentPDF && (
          <div className="text-center text-muted-foreground text-sm">
            Upload a PDF to start chatting with your document
          </div>
        )}
      </CardContent>
    </Card>
  );
};
