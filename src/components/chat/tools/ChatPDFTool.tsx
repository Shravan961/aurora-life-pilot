
import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, Upload, Loader2, MessageCircle, X, File, Type, Copy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { pdfService } from '@/services/pdfService';

interface ChatPDFToolProps {
  onSendToChat: (message: string) => void;
}

interface ProcessedDocument {
  id: string;
  name: string;
  type: 'pdf' | 'text';
  totalPages?: number;
  wordCount?: number;
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
  const [currentDoc, setCurrentDoc] = useState<ProcessedDocument | null>(null);
  const [question, setQuestion] = useState('');
  const [textInput, setTextInput] = useState('');
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
      
      setCurrentDoc({
        id: processedPDF.id,
        name: processedPDF.name,
        type: 'pdf',
        totalPages: processedPDF.totalPages,
        createdAt: processedPDF.createdAt
      });

      setChatHistory([]);
      
      toast({
        title: "Success",
        description: `PDF "${file.name}" processed successfully! You can now ask questions about it.`
      });

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

  const handleTextProcess = async () => {
    if (!textInput.trim()) {
      toast({
        title: "Error",
        description: "Please enter some text to analyze",
        variant: "destructive"
      });
      return;
    }

    setProcessing(true);

    try {
      const processedText = await pdfService.processText(textInput.trim());
      
      setCurrentDoc({
        id: processedText.id,
        name: 'Pasted Text Document',
        type: 'text',
        wordCount: textInput.trim().split(/\s+/).length,
        createdAt: new Date()
      });

      setChatHistory([]);
      setTextInput('');
      
      toast({
        title: "Success",
        description: "Text processed successfully! You can now ask questions about it."
      });

      onSendToChat(`📝 **Text Document**: Processed ${textInput.trim().split(/\s+/).length} words of text. Ready for analysis!`);

    } catch (error) {
      console.error('Text processing error:', error);
      toast({
        title: "Error",
        description: "Failed to process text",
        variant: "destructive"
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleAskQuestion = async () => {
    if (!question.trim() || !currentDoc) {
      toast({
        title: "Error",
        description: currentDoc ? "Please enter a question" : "Please upload a document or paste text first",
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
      const answer = await pdfService.answerQuestion(currentDoc.id, currentQuestion);
      
      const assistantMessage: ChatMessage = {
        id: `msg_${Date.now()}_response`,
        type: 'assistant',
        content: answer,
        timestamp: new Date()
      };

      setChatHistory(prev => [...prev, assistantMessage]);

      onSendToChat(`**Q:** ${currentQuestion}\n\n**A:** ${answer}\n\n*Source: ${currentDoc.name}*`);

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

  const handleRemoveDoc = () => {
    if (currentDoc) {
      pdfService.removePDF(currentDoc.id);
      setCurrentDoc(null);
      setChatHistory([]);
      toast({
        title: "Success",
        description: "Document removed successfully"
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
          ChatPDF Enhanced
        </CardTitle>
        <CardDescription>
          Upload PDF documents or paste text blocks for AI-powered analysis
        </CardDescription>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col space-y-4">
        <Tabs defaultValue="upload" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="upload">
              <Upload className="h-4 w-4 mr-2" />
              Upload PDF
            </TabsTrigger>
            <TabsTrigger value="paste">
              <Type className="h-4 w-4 mr-2" />
              Paste Text
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="upload" className="space-y-3">
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
          </TabsContent>
          
          <TabsContent value="paste" className="space-y-3">
            <Textarea
              placeholder="Paste your text here (articles, documents, notes, etc.)"
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              className="min-h-32 resize-none"
              disabled={processing}
            />
            <Button
              onClick={handleTextProcess}
              disabled={!textInput.trim() || processing}
              className="w-full"
            >
              {processing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Type className="h-4 w-4 mr-2" />
                  Process Text
                </>
              )}
            </Button>
          </TabsContent>
        </Tabs>

        {processing && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted p-3 rounded-lg">
            <Loader2 className="h-4 w-4 animate-spin" />
            Processing document... This may take a moment for large documents.
          </div>
        )}

        {/* Current Document Info */}
        {currentDoc && (
          <div className="flex items-center justify-between p-3 bg-primary/10 rounded-lg">
            <div className="flex items-center gap-2">
              {currentDoc.type === 'pdf' ? (
                <File className="h-4 w-4 text-primary" />
              ) : (
                <Type className="h-4 w-4 text-primary" />
              )}
              <div>
                <p className="font-medium text-sm">{currentDoc.name}</p>
                <p className="text-xs text-muted-foreground">
                  {currentDoc.type === 'pdf' 
                    ? `${currentDoc.totalPages} pages` 
                    : `${currentDoc.wordCount} words`
                  } • Processed {currentDoc.createdAt.toLocaleTimeString()}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRemoveDoc}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Quick Questions */}
        {currentDoc && chatHistory.length === 0 && (
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
            placeholder={currentDoc ? "Ask a question about the document..." : "Upload a document or paste text first"}
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            disabled={!currentDoc || loadingAnswer}
            onKeyPress={(e) => e.key === 'Enter' && !loadingAnswer && handleAskQuestion()}
          />
          <Button
            onClick={handleAskQuestion}
            disabled={!currentDoc || !question.trim() || loadingAnswer}
          >
            {loadingAnswer ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <MessageCircle className="h-4 w-4" />
            )}
          </Button>
        </div>

        {!currentDoc && (
          <div className="text-center text-muted-foreground text-sm">
            Upload a PDF or paste text to start analyzing your document
          </div>
        )}
      </CardContent>
    </Card>
  );
};
