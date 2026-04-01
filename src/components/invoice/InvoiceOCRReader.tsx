// components/ocr/InvoiceOCRReader.tsx
import React, { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import Tesseract, { createWorker } from 'tesseract.js';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Upload, 
  FileText, 
  Image as ImageIcon, 
  Receipt, 
  Scan, 
  CheckCircle, 
  X,
  Camera,
  Sparkles,
  Brain,
  Zap,
  Loader2,
  AlertTriangle,
  AlertCircle
} from 'lucide-react';

interface InvoiceOCRReaderProps {
  onExtractedData: (data: ExtractedInvoiceData) => void;
  onClose: () => void;
}

interface ExtractedInvoiceData {
  vendor: string;
  date: string;
  total: number;
  items: Array<{
    description: string;
    amount: number;
    quantity: number;
  }>;
  category: string;
  confidence: number;
  rawText: string;
}

export const InvoiceOCRReader: React.FC<InvoiceOCRReaderProps> = ({ onExtractedData, onClose }) => {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>('');
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<string>('');
  const [extractedData, setExtractedData] = useState<ExtractedInvoiceData | null>(null);
  const [error, setError] = useState<string>('');
  const [worker, setWorker] = useState<Tesseract.Worker | null>(null);

  // Initialize worker
  useEffect(() => {
    const initWorker = async () => {
      try {
        const newWorker = await createWorker({
          logger: (m) => {
            console.log('Tesseract Log:', m);
            if (m.status === 'recognizing text') {
              setProgress(Math.round((m.progress || 0) * 100));
              setStatus(`Recognizing text: ${Math.round((m.progress || 0) * 100)}%`);
            } else if (m.status) {
              setStatus(m.status);
            }
          },
          errorHandler: (err) => {
            console.error('Tesseract Error:', err);
            setError(`OCR Error: ${err.message}`);
          }
        });
        
        await newWorker.loadLanguage('eng');
        await newWorker.initialize('eng');
        
        // Configure for receipt/invoice reading
        await newWorker.setParameters({
          tessedit_pageseg_mode: Tesseract.PSM.AUTO,
          tessedit_char_whitelist: '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz₹$.,/- ',
          preserve_interword_spaces: '1',
        });
        
        setWorker(newWorker);
      } catch (err: any) {
        console.error('Failed to initialize OCR worker:', err);
        setError(`Failed to initialize OCR: ${err.message}`);
      }
    };
    
    initWorker();
    
    return () => {
      if (worker) {
        worker.terminate();
      }
    };
  }, []);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp', 'image/bmp'];
    if (!validTypes.includes(file.type)) {
      setError('Please upload a valid image (JPEG, PNG, JPG, WebP, BMP)');
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setError('File size should be less than 5MB');
      return;
    }

    setUploadedFile(file);
    setError('');
    setExtractedData(null);
    
    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp', '.bmp']
    },
    maxFiles: 1,
    maxSize: 5 * 1024 * 1024, // 5MB
  });

  // Vendor patterns for Indian context
  const VENDOR_PATTERNS: Record<string, string[]> = {
    'Amazon': ['amazon', 'amzn'],
    'Swiggy': ['swiggy'],
    'Zomato': ['zomato'],
    'Uber': ['uber'],
    'Ola': ['ola'],
    'Flipkart': ['flipkart'],
    'BigBasket': ['bigbasket'],
    'Dominos': ['dominos', 'domino'],
    'McDonalds': ['mcdonalds'],
    'Starbucks': ['starbucks'],
    'Netflix': ['netflix'],
    'Spotify': ['spotify'],
    'PhonePe': ['phonepe'],
    'Paytm': ['paytm'],
    'Google': ['google'],
    'Apple': ['apple'],
    'Reliance': ['reliance'],
    'Jio': ['jio'],
    'Airtel': ['airtel'],
    'Vodafone': ['vodafone'],
  };

  // Category mapping
  const CATEGORY_KEYWORDS: Record<string, string[]> = {
    'Food & Dining': ['restaurant', 'cafe', 'food', 'dining', 'meal', 'coffee', 'tea', 'bakery', 'pizza', 'burger'],
    'Groceries': ['groceries', 'vegetables', 'fruits', 'milk', 'bread', 'supermarket', 'mart'],
    'Travel & Transport': ['travel', 'flight', 'train', 'bus', 'taxi', 'cab', 'metro', 'railway'],
    'Shopping': ['shopping', 'mall', 'store', 'clothing', 'apparel', 'electronics', 'fashion'],
    'Bills & Utilities': ['bill', 'invoice', 'payment', 'due', 'utility', 'mobile', 'internet'],
    'Entertainment': ['movie', 'cinema', 'ott', 'streaming', 'game', 'concert', 'theater'],
    'Fuel': ['petrol', 'diesel', 'fuel', 'gasoline', 'filling', 'station'],
    'Healthcare': ['medical', 'doctor', 'medicine', 'pharmacy', 'hospital', 'clinic'],
  };

  // Smart text analysis
  const analyzeExtractedText = (text: string): ExtractedInvoiceData => {
    console.log('Analyzing text:', text);
    
    const lines = text.split('\n').filter(line => line.trim().length > 0);
    let vendor = 'Unknown Vendor';
    let date = new Date().toISOString().split('T')[0];
    let total = 0;
    const items: Array<{ description: string; amount: number; quantity: number }> = [];
    let category = 'Other';
    let confidence = 0;
    
    const lowerText = text.toLowerCase();
    
    // 1. Detect Vendor
    for (const [vendorName, patterns] of Object.entries(VENDOR_PATTERNS)) {
      if (patterns.some(pattern => lowerText.includes(pattern))) {
        vendor = vendorName;
        confidence += 30;
        console.log('Detected vendor:', vendorName);
        break;
      }
    }
    
    // 2. Detect Date (multiple patterns)
    const datePatterns = [
      /(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/g,
      /(\d{2,4}[\/\-]\d{1,2}[\/\-]\d{1,2})/g,
      /Date[:\s]*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/gi,
      /(\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{4})/gi,
    ];
    
    for (const pattern of datePatterns) {
      const matches = text.match(pattern);
      if (matches && matches.length > 0) {
        date = matches[0];
        confidence += 20;
        console.log('Detected date:', date);
        break;
      }
    }
    
    // 3. Detect Total Amount (multiple strategies)
    const amountPatterns = [
      /Total[:\s]*[₹$]?\s*([\d,]+\.?\d*)/gi,
      /Grand Total[:\s]*[₹$]?\s*([\d,]+\.?\d*)/gi,
      /Amount[:\s]*[₹$]?\s*([\d,]+\.?\d*)/gi,
      /[₹$]\s*([\d,]+\.?\d*)/g,
      /\b([\d,]+\.?\d{2})\b/g, // Standalone amounts with 2 decimal places
    ];
    
    const foundAmounts: number[] = [];
    
    for (const pattern of amountPatterns) {
      const matches = text.match(pattern);
      if (matches) {
        matches.forEach(match => {
          // Extract numeric value
          const numMatch = match.match(/([\d,]+\.?\d*)/);
          if (numMatch) {
            const numStr = numMatch[1].replace(/,/g, '');
            const amount = parseFloat(numStr);
            if (!isNaN(amount) && amount > 0 && amount < 1000000) { // Sanity check
              foundAmounts.push(amount);
            }
          }
        });
      }
    }
    
    // Also look for numbers that could be amounts
    const numberMatches = text.match(/\b(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)\b/g);
    if (numberMatches) {
      numberMatches.forEach(match => {
        const amount = parseFloat(match.replace(/,/g, ''));
        if (!isNaN(amount) && amount > 10 && amount < 100000) {
          foundAmounts.push(amount);
        }
      });
    }
    
    // Remove duplicates and sort descending
    const uniqueAmounts = [...new Set(foundAmounts)].sort((a, b) => b - a);
    console.log('Found amounts:', uniqueAmounts);
    
    if (uniqueAmounts.length > 0) {
      // The largest amount is usually the total
      total = uniqueAmounts[0];
      confidence += 30;
      
      // Try to find items (amounts that are smaller than total)
      const itemAmounts = uniqueAmounts.filter(amt => amt < total && amt > 0);
      itemAmounts.forEach((amt, index) => {
        // Find description near this amount
        const amountStr = amt.toString();
        const amountIndex = text.indexOf(amountStr);
        if (amountIndex > -1) {
          // Look backwards for description (50 chars before amount)
          const start = Math.max(0, amountIndex - 50);
          const context = text.substring(start, amountIndex);
          const lines = context.split('\n');
          const description = lines[lines.length - 1]?.trim() || `Item ${index + 1}`;
          
          items.push({
            description: description.substring(0, 50),
            amount: amt,
            quantity: 1
          });
        }
      });
    }
    
    // 4. Detect Category
    for (const [cat, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
      if (keywords.some(keyword => lowerText.includes(keyword))) {
        category = cat;
        confidence += 20;
        console.log('Detected category:', cat);
        break;
      }
    }
    
    confidence = Math.min(100, confidence);
    
    return {
      vendor,
      date,
      total,
      items: items.slice(0, 5), // Limit to 5 items
      category,
      confidence,
      rawText: text.substring(0, 500) // Store first 500 chars
    };
  };

  const processFile = async () => {
    if (!uploadedFile || !worker) {
      setError('OCR engine not ready. Please try again.');
      return;
    }
    
    setProcessing(true);
    setProgress(0);
    setStatus('Initializing...');
    setError('');
    
    try {
      // Validate image dimensions
      const img = new Image();
      img.src = preview;
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
      });
      
      if (img.width < 100 || img.height < 100) {
        throw new Error('Image is too small. Please upload a larger image.');
      }
      
      setStatus('Processing image...');
      
      // Perform OCR
      const { data: { text } } = await worker.recognize(uploadedFile);
      
      if (!text || text.trim().length < 10) {
        throw new Error('Could not extract text from image. Please try with a clearer image.');
      }
      
      setStatus('Analyzing extracted text...');
      
      const analyzedData = analyzeExtractedText(text);
      setExtractedData(analyzedData);
      
      setStatus('Complete');
      
    } catch (err: any) {
      console.error('OCR Processing Error:', err);
      
      let errorMessage = 'Failed to process the file. ';
      
      if (err.message.includes('network') || err.message.includes('fetch')) {
        errorMessage += 'Network error. Please check your internet connection.';
      } else if (err.message.includes('memory')) {
        errorMessage += 'Image is too large. Please try a smaller image.';
      } else if (err.message.includes('small')) {
        errorMessage += 'Image is too small. Please upload a larger image.';
      } else {
        errorMessage += 'Please try with a clearer image or different file.';
      }
      
      setError(errorMessage);
    } finally {
      setProcessing(false);
      setProgress(100);
    }
  };

  const handleSave = () => {
    if (extractedData) {
      onExtractedData(extractedData);
      onClose();
    }
  };

  return (
    <div className="space-y-6">
      {/* Upload Zone */}
      {!uploadedFile && (
        <div
          {...getRootProps()}
          className={`border-3 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
            isDragActive
              ? 'border-primary bg-primary/10'
              : 'border-muted-foreground/30 hover:border-primary hover:bg-primary/5'
          }`}
        >
          <input {...getInputProps()} />
          <div className="space-y-4">
            <div className="flex justify-center">
              <div className="p-4 rounded-full bg-primary/10">
                {isDragActive ? (
                  <Upload className="w-12 h-12 text-primary animate-bounce" />
                ) : (
                  <Camera className="w-12 h-12 text-primary" />
                )}
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2">
                {isDragActive ? 'Drop your bill here' : 'Upload Bill/Invoice'}
              </h3>
              <p className="text-muted-foreground mb-4">
                Take a photo or upload image of your receipt
              </p>
              <Button variant="outline">
                <Scan className="w-4 h-4 mr-2" />
                Choose File
              </Button>
            </div>
            <div className="text-xs text-muted-foreground space-y-1">
              <p>✅ Supports: JPG, PNG, WebP (Max 5MB)</p>
              <p>✅ Tips: Good lighting, flat surface, clear text</p>
              <p>✅ Works best with: Restaurant bills, shopping receipts</p>
            </div>
          </div>
        </div>
      )}

      {/* File Preview & Processing */}
      {uploadedFile && !extractedData && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Uploaded File
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-secondary/30 rounded-lg">
              <Receipt className="w-8 h-8 text-primary" />
              <div className="flex-1">
                <div className="font-medium">{uploadedFile.name}</div>
                <div className="text-sm text-muted-foreground">
                  {(uploadedFile.size / 1024).toFixed(0)} KB • {uploadedFile.type}
                </div>
              </div>
            </div>
            
            {preview && (
              <div className="mt-4">
                <div className="text-sm font-medium mb-2">Preview:</div>
                <div className="relative max-w-md mx-auto">
                  <img 
                    src={preview} 
                    alt="Invoice preview" 
                    className="rounded-lg border shadow-sm max-h-64 object-contain mx-auto"
                    onError={() => setError('Failed to load image preview')}
                  />
                  <div className="absolute inset-0 border-2 border-primary/30 rounded-lg pointer-events-none" />
                </div>
              </div>
            )}
            
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setUploadedFile(null);
                  setPreview('');
                  setError('');
                }}
                disabled={processing}
              >
                <X className="w-4 h-4 mr-2" />
                Change File
              </Button>
              <Button
                onClick={processFile}
                disabled={processing || !worker}
                className="flex-1"
              >
                {processing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {status || 'Processing...'}
                  </>
                ) : !worker ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Loading OCR Engine...
                  </>
                ) : (
                  <>
                    <Brain className="w-4 h-4 mr-2" />
                    Extract Details
                  </>
                )}
              </Button>
            </div>
            
            {processing && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Progress</span>
                  <span>{progress}%</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Extracted Results */}
      {extractedData && !processing && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-yellow-500" />
              AI Extracted Details
              <Badge className={`ml-2 ${
                extractedData.confidence > 80 ? 'bg-green-500' :
                extractedData.confidence > 60 ? 'bg-yellow-500' : 'bg-orange-500'
              }`}>
                {extractedData.confidence}% Confidence
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Vendor & Date */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-secondary/30 rounded-lg">
                <div className="text-xs text-muted-foreground">Vendor</div>
                <div className="font-semibold">{extractedData.vendor}</div>
              </div>
              <div className="p-3 bg-secondary/30 rounded-lg">
                <div className="text-xs text-muted-foreground">Date</div>
                <div className="font-semibold">
                  {extractedData.date}
                </div>
              </div>
            </div>
            
            {/* Total Amount */}
            <div className="p-4 bg-gradient-to-r from-primary/10 to-blue-500/10 rounded-lg border border-primary/20">
              <div className="text-xs text-muted-foreground">Total Amount</div>
              <div className="text-3xl font-bold text-primary">
                ₹{extractedData.total.toLocaleString('en-IN')}
              </div>
            </div>
            
            {/* Category */}
            <div className="p-3 bg-secondary/30 rounded-lg">
              <div className="text-xs text-muted-foreground">Detected Category</div>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="secondary">{extractedData.category}</Badge>
                <span className="text-sm text-muted-foreground">
                  Based on content analysis
                </span>
              </div>
            </div>
            
            {/* Items List */}
            {extractedData.items.length > 0 && (
              <div>
                <div className="text-sm font-medium mb-2">Detected Items:</div>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {extractedData.items.map((item, index) => (
                    <div key={index} className="flex justify-between items-center p-2 bg-background/50 rounded">
                      <div className="flex-1">
                        <div className="text-sm">{item.description}</div>
                      </div>
                      <div className="font-semibold">
                        ₹{item.amount.toLocaleString('en-IN')}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Confidence Notes */}
            <Alert className={
              extractedData.confidence > 80 ? 'border-green-500/30 bg-green-500/10' :
              extractedData.confidence > 60 ? 'border-yellow-500/30 bg-yellow-500/10' :
              'border-orange-500/30 bg-orange-500/10'
            }>
              {extractedData.confidence > 80 ? (
                <>
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <AlertDescription className="ml-2">
                    High confidence extraction. Ready to save.
                  </AlertDescription>
                </>
              ) : extractedData.confidence > 60 ? (
                <>
                  <AlertTriangle className="h-4 w-4 text-yellow-500" />
                  <AlertDescription className="ml-2">
                    Medium confidence. Please verify details.
                  </AlertDescription>
                </>
              ) : (
                <>
                  <AlertCircle className="h-4 w-4 text-orange-500" />
                  <AlertDescription className="ml-2">
                    Low confidence. Manual verification required.
                  </AlertDescription>
                </>
              )}
            </Alert>
            
            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setExtractedData(null);
                  setUploadedFile(null);
                  setPreview('');
                }}
                className="flex-1"
              >
                <X className="w-4 h-4 mr-2" />
                Scan Another
              </Button>
              <Button
                onClick={handleSave}
                className="flex-1 bg-gradient-to-r from-primary to-blue-600"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Save Expense
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="ml-2">
            {error}
          </AlertDescription>
        </Alert>
      )}
      
      {/* Debug Info (remove in production) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="text-xs text-muted-foreground p-2 bg-secondary/30 rounded">
          <div>OCR Status: {worker ? 'Ready' : 'Loading...'}</div>
          <div>Processing: {processing ? 'Yes' : 'No'}</div>
        </div>
      )}
    </div>
  );
};