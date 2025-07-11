import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Copy, Download, Trash2, AlignLeft, Wand2, Clock } from "lucide-react";
import { loadMonaco, getLanguageFromValue } from "@/lib/monaco-config";
import { useTheme } from "@/components/theme-provider";
import { useToast } from "@/hooks/use-toast";
import { languages, type LanguageValue } from "@shared/schema";

interface EditorPanelProps {
  title: string;
  language: LanguageValue;
  value: string;
  onChange?: (value: string) => void;
  readOnly?: boolean;
  placeholder?: string;
  confidence?: number;
  translationTime?: number;
  onClear?: () => void;
  onFormat?: () => void;
  onCopy?: () => void;
  onDownload?: () => void;
}

export function EditorPanel({
  title,
  language,
  value,
  onChange,
  readOnly = false,
  placeholder,
  confidence,
  translationTime,
  onClear,
  onFormat,
  onCopy,
  onDownload,
}: EditorPanelProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const editorInstanceRef = useRef<any>(null);
  const { theme } = useTheme();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);

  const languageInfo = languages.find((l) => l.value === language);

  useEffect(() => {
    if (!editorRef.current) return;

    const initEditor = async () => {
      try {
        const monaco = await loadMonaco();

        if (editorInstanceRef.current) {
          editorInstanceRef.current.dispose();
        }

        editorInstanceRef.current = monaco.editor.create(editorRef.current, {
          value: value || "",
          language: getLanguageFromValue(language),
          theme: theme === "dark" ? "dark-theme" : "light-theme",
          readOnly,
          fontSize: 14,
          fontFamily: "'JetBrains Mono', monospace",
          lineNumbers: "on",
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
          automaticLayout: true,
          wordWrap: "on",
          tabSize: 2,
          insertSpaces: true,
          renderWhitespace: "selection",
          bracketPairColorization: {
            enabled: true,
          },
        });

        if (onChange && !readOnly) {
          editorInstanceRef.current.onDidChangeModelContent(() => {
            onChange(editorInstanceRef.current.getValue());
          });
        }

        setIsLoading(false);
      } catch (error) {
        console.error("Failed to load Monaco editor:", error);
        setIsLoading(false);
      }
    };

    initEditor();

    return () => {
      if (editorInstanceRef.current) {
        editorInstanceRef.current.dispose();
      }
    };
  }, [language, readOnly]);

  useEffect(() => {
    if (
      editorInstanceRef.current &&
      value !== editorInstanceRef.current.getValue()
    ) {
      editorInstanceRef.current.setValue(value || "");
    }
  }, [value]);

  useEffect(() => {
    if (editorInstanceRef.current) {
      const monaco = window.monaco;
      if (monaco) {
        monaco.editor.setTheme(theme === "dark" ? "dark-theme" : "light-theme");
      }
    }
  }, [theme]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      toast({
        title: "Copied to clipboard",
        description: "Code has been copied to your clipboard.",
      });
      onCopy?.();
    } catch (error) {
      toast({
        title: "Failed to copy",
        description: "Could not copy code to clipboard.",
        variant: "destructive",
      });
    }
  };

  const handleDownload = () => {
    const blob = new Blob([value], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `code.${language === "cpp" ? "cpp" : language}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    onDownload?.();
  };

  return (
    <div className="flex-1 flex flex-col">
      <div className="bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-700 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <h3 className="font-medium text-gray-900 dark:text-gray-100">
            {title}
          </h3>
          <div className="flex items-center space-x-2">
            <Badge
              className={`text-xs ${languageInfo ? `language-badge-${language}` : ""}`}
            >
              {languageInfo?.label || language}
            </Badge>
            {confidence !== undefined && (
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-xs text-gray-500">
                  {confidence}% confidence
                </span>
              </div>
            )}
            {!readOnly && (
              <Button
                variant="ghost"
                size="sm"
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
              >
                <Wand2 className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {translationTime && (
            <div className="text-xs text-gray-500 flex items-center space-x-1">
              <Clock className="w-3 h-3" />
              <span>{(translationTime / 1000).toFixed(1)}s</span>
            </div>
          )}
          {!readOnly && onFormat && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onFormat}
              className="text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            >
              <AlignLeft className="w-4 h-4 mr-1" />
              Format
            </Button>
          )}
          {readOnly && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCopy}
              className="text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            >
              <Copy className="w-4 h-4 mr-1" />
              Copy
            </Button>
          )}
          {readOnly && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDownload}
              className="text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            >
              <Download className="w-4 h-4 mr-1" />
              Save
            </Button>
          )}
          {!readOnly && onClear && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClear}
              className="text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            >
              <Trash2 className="w-4 h-4 mr-1" />
              Clear
            </Button>
          )}
        </div>
      </div>

      <div className="flex-1 bg-gray-50 dark:bg-slate-950 p-4">
        <div className="h-full bg-white dark:bg-slate-900 rounded-lg border border-gray-200 dark:border-slate-700 overflow-hidden relative">
          {confidence !== undefined && confidence >= 95 && (
            <div className="absolute top-4 right-4 z-10">
              <div className="glass-panel px-3 py-1 rounded-full">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-xs font-medium">
                    {confidence}% Confidence
                  </span>
                </div>
              </div>
            </div>
          )}

          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-sm text-gray-500">Loading editor...</div>
            </div>
          ) : (
            <div ref={editorRef} className="h-full" />
          )}

          {!value && placeholder && !isLoading && (
            <div className="absolute inset-4 flex items-start pt-4 pointer-events-none">
              <span className="text-gray-400 dark:text-gray-600 font-mono text-sm">
                {placeholder}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
