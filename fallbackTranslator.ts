import { Language } from "../shared/schema";
import { languageTemplates } from "./languageTemplates";

interface FallbackTranslation {
  translatedCode: string;
  confidence: number;
  isFallback: true;
}

/**
 * Basic fallback translator for when OpenAI quota is exceeded
 * Provides simple syntax conversions between languages
 */
export function fallbackTranslate(
  sourceCode: string,
  sourceLanguage: Language,
  targetLanguage: Language
): FallbackTranslation {
  let translatedCode = sourceCode;
  let confidence = 30;

  const sourceId = sourceLanguage.id.toLowerCase();
  const targetId = targetLanguage.id.toLowerCase();

  // Check if we have templates for both languages
  const sourceTemplate = languageTemplates[sourceId];
  const targetTemplate = languageTemplates[targetId];

  if (sourceTemplate && targetTemplate) {
    translatedCode = translateWithTemplates(sourceCode, sourceTemplate, targetTemplate, sourceId, targetId);
    confidence = 60;
  } else {
    // Fall back to existing specific translations
    if (sourceId === "python") {
      // Python to other languages
      if (targetId === "javascript") {
        translatedCode = pythonToJavaScript(sourceCode);
        confidence = 70;
      } else if (targetId === "java") {
        translatedCode = pythonToJava(sourceCode);
        confidence = 65;
      } else if (targetId === "cpp") {
        translatedCode = pythonToCpp(sourceCode);
        confidence = 60;
      } else if (targetId === "c") {
        translatedCode = pythonToC(sourceCode);
        confidence = 55;
      } else if (targetId === "typescript") {
        translatedCode = pythonToTypeScript(sourceCode);
        confidence = 70;
      } else if (targetId === "go") {
        translatedCode = pythonToGo(sourceCode);
        confidence = 60;
      } else if (targetId === "ruby") {
        translatedCode = pythonToRuby(sourceCode);
        confidence = 65;
      } else if (targetId === "php") {
        translatedCode = pythonToPhp(sourceCode);
        confidence = 60;
      } else if (targetId === "swift") {
        translatedCode = pythonToSwift(sourceCode);
        confidence = 55;
      } else if (targetId === "csharp") {
        translatedCode = pythonToCSharp(sourceCode);
        confidence = 60;
      } else {
        translatedCode = genericTranslation(sourceCode, sourceLanguage, targetLanguage);
        confidence = 30;
      }
    } else if (sourceId === "javascript" && targetId === "python") {
      translatedCode = javaScriptToPython(sourceCode);
      confidence = 50;
    } else if (sourceId === "java" && targetId === "csharp") {
      translatedCode = javaToCSharp(sourceCode);
      confidence = 40;
    } else {
      translatedCode = genericTranslation(sourceCode, sourceLanguage, targetLanguage);
      confidence = 25;
    }
  }

  return {
    translatedCode,
    confidence,
    isFallback: true,
  };
}

/**
 * Template-based translation using language templates
 */
function translateWithTemplates(code: string, sourceTemplate: any, targetTemplate: any, sourceId: string, targetId: string): string {
  let translated = code;

  // Handle print statements from various languages
  if (sourceId === "python" && code.includes("print(")) {
    translated = translated.replace(/print\((.*?)\)/g, (match, content) => {
      return targetTemplate.printStatement(content);
    });
  } else if (sourceId === "javascript" && code.includes("console.log(")) {
    translated = translated.replace(/console\.log\((.*?)\)/g, (match, content) => {
      return targetTemplate.printStatement(content);
    });
  } else if (sourceId === "java" && code.includes("System.out.println(")) {
    translated = translated.replace(/System\.out\.println\((.*?)\)/g, (match, content) => {
      return targetTemplate.printStatement(content);
    });
  } else if (sourceId === "cpp" && code.includes("std::cout")) {
    translated = translated.replace(/std::cout\s*<<\s*(.*?)\s*<<\s*std::endl;?/g, (match, content) => {
      return targetTemplate.printStatement(content);
    });
  } else if (sourceId === "c" && code.includes("printf(")) {
    translated = translated.replace(/printf\((.*?)\);?/g, (match, content) => {
      // Handle printf format strings
      const cleanContent = content.replace(/["'](.*)["']/, '"$1"').replace(/\\n/g, '');
      return targetTemplate.printStatement(cleanContent);
    });
  } else if (sourceId === "csharp" && code.includes("Console.WriteLine(")) {
    translated = translated.replace(/Console\.WriteLine\((.*?)\)/g, (match, content) => {
      return targetTemplate.printStatement(content);
    });
  }

  // Handle basic variable declarations
  if (sourceId === "javascript" && targetId !== "javascript") {
    translated = translated.replace(/let\s+(\w+)\s*=\s*(.*?);/g, (match, varName, value) => {
      return targetTemplate.variableDeclaration(varName, value);
    });
    translated = translated.replace(/const\s+(\w+)\s*=\s*(.*?);/g, (match, varName, value) => {
      return targetTemplate.variableDeclaration(varName, value);
    });
  }

  // Add necessary imports and boilerplate
  if (targetTemplate.imports && targetTemplate.imports.length > 0) {
    translated = targetTemplate.imports.join('\n') + '\n\n' + translated;
  }

  // Wrap in main function if needed and code doesn't already have main
  if (targetTemplate.mainFunction && !translated.includes('main') && !translated.includes('class')) {
    // Extract just the core logic
    const coreLogic = translated.replace(/^.*?(?:import|#include|using|package).*?\n*/gm, '').trim();
    translated = targetTemplate.mainFunction(coreLogic);
  }

  return translated;
}

function pythonToJavaScript(code: string): string {
  return code
    // Print statements with various formats
    .replace(/print\s*\(\s*"([^"]+)"\s*\)/g, 'console.log("$1");')
    .replace(/print\s*\(\s*'([^']+)'\s*\)/g, "console.log('$1');")
    .replace(/print\s*\(\s*([^)]+)\s*\)/g, 'console.log($1);')
    
    // Variable assignments with type inference
    .replace(/^(\s*)(\w+)\s*=\s*"([^"]*)"$/gm, '$1let $2 = "$3";')
    .replace(/^(\s*)(\w+)\s*=\s*'([^']*)'$/gm, "$1let $2 = '$3';")
    .replace(/^(\s*)(\w+)\s*=\s*(\d+\.?\d*)$/gm, "$1let $2 = $3;")
    .replace(/^(\s*)(\w+)\s*=\s*True$/gm, "$1let $2 = true;")
    .replace(/^(\s*)(\w+)\s*=\s*False$/gm, "$1let $2 = false;")
    .replace(/^(\s*)(\w+)\s*=\s*None$/gm, "$1let $2 = null;")
    .replace(/^(\s*)(\w+)\s*=\s*\[(.*?)\]$/gm, "$1let $2 = [$3];")
    .replace(/^(\s*)(\w+)\s*=\s*\{(.*?)\}$/gm, "$1let $2 = {$3};")
    .replace(/^(\s*)(\w+)\s*=\s*([^=\n]+)$/gm, '$1let $2 = $3;')
    
    // Function definitions
    .replace(/def\s+(\w+)\s*\(([^)]*)\)\s*:/g, 'function $1($2) {')
    .replace(/^(\s*)return\s+(.+)$/gm, '$1return $2;')
    
    // Control structures
    .replace(/if\s+([^:]+?):/g, 'if ($1) {')
    .replace(/elif\s+([^:]+?):/g, '} else if ($1) {')
    .replace(/else\s*:/g, '} else {')
    .replace(/while\s+([^:]+?):/g, 'while ($1) {')
    
    // For loops with range
    .replace(/for\s+(\w+)\s+in\s+range\s*\(\s*(\d+)\s*\)\s*:/g, 'for (let $1 = 0; $1 < $2; $1++) {')
    .replace(/for\s+(\w+)\s+in\s+range\s*\(\s*(\d+),\s*(\d+)\s*\)\s*:/g, 'for (let $1 = $2; $1 < $3; $1++) {')
    .replace(/for\s+(\w+)\s+in\s+range\s*\(\s*(\d+),\s*(\d+),\s*(\d+)\s*\)\s*:/g, 'for (let $1 = $2; $1 < $3; $1 += $4) {')
    .replace(/for\s+(\w+)\s+in\s+(.+?):/g, 'for (let $1 of $2) {')
    
    // List methods
    .replace(/\.append\(/g, '.push(')
    .replace(/\.extend\(/g, '.push(...')
    .replace(/len\(([^)]+)\)/g, '$1.length')
    
    // String methods
    .replace(/\.strip\(\)/g, '.trim()')
    .replace(/\.split\(/g, '.split(')
    .replace(/\.join\(/g, '.join(')
    .replace(/\.upper\(\)/g, '.toUpperCase()')
    .replace(/\.lower\(\)/g, '.toLowerCase()')
    
    // Boolean operators
    .replace(/\band\b/g, '&&')
    .replace(/\bor\b/g, '||')
    .replace(/\bnot\b/g, '!')
    .replace(/\bTrue\b/g, 'true')
    .replace(/\bFalse\b/g, 'false')
    .replace(/\bNone\b/g, 'null')
    
    // Input/Output
    .replace(/input\s*\(\s*"([^"]+)"\s*\)/g, 'prompt("$1")')
    .replace(/input\s*\(\s*'([^']+)'\s*\)/g, "prompt('$1')")
    .replace(/input\s*\(\s*([^)]*)\s*\)/g, 'prompt($1)')
    
    // Comments
    .replace(/^\s*#\s*(.*?)$/gm, '// $1')
    
    // Try/except to try/catch
    .replace(/try\s*:/g, 'try {')
    .replace(/except\s+(\w+)\s*:/g, '} catch ($1) {')
    .replace(/except\s*:/g, '} catch (error) {')
    .replace(/finally\s*:/g, '} finally {')
    
    // Class definitions
    .replace(/class\s+(\w+)\s*:/g, 'class $1 {')
    .replace(/class\s+(\w+)\s*\(\s*(\w+)\s*\)\s*:/g, 'class $1 extends $2 {')
    
    // Add closing braces based on indentation
    .split('\n')
    .map((line, index, lines) => {
      const currentIndent = line.match(/^\s*/)?.[0].length || 0;
      const nextIndent = lines[index + 1]?.match(/^\s*/)?.[0].length || 0;
      
      if (currentIndent > nextIndent && line.trim() && !line.trim().endsWith('{') && !line.trim().endsWith('}')) {
        const braceIndent = ' '.repeat(nextIndent);
        return line + '\n' + braceIndent + '}';
      }
      return line;
    })
    .join('\n');
}

function javaScriptToPython(code: string): string {
  return code
    // Convert console.log
    .replace(/console\.log\s*\(\s*([^)]+)\s*\)\s*;?/g, 'print($1)')
    
    // Convert let/const/var declarations
    .replace(/(?:let|const|var)\s+(\w+)\s*=\s*([^;]+);?/g, '$1 = $2')
    
    // Convert function declarations
    .replace(/function\s+(\w+)\s*\(([^)]*)\)\s*\{/g, 'def $1($2):')
    
    // Convert if statements
    .replace(/if\s*\(\s*([^)]+)\s*\)\s*\{/g, 'if $1:')
    .replace(/\}\s*else\s*if\s*\(\s*([^)]+)\s*\)\s*\{/g, 'elif $1:')
    .replace(/\}\s*else\s*\{/g, 'else:')
    
    // Convert for loops
    .replace(/for\s*\(\s*let\s+(\w+)\s*=\s*0\s*;\s*\1\s*<\s*(\d+)\s*;\s*\1\+\+\s*\)\s*\{/g, 'for $1 in range($2):')
    
    // Convert while loops
    .replace(/while\s*\(\s*([^)]+)\s*\)\s*\{/g, 'while $1:')
    
    // Remove braces and semicolons
    .replace(/\}/g, '')
    .replace(/;$/gm, '');
}

function javaToCSharp(code: string): string {
  return code
    // Convert System.out.println to Console.WriteLine
    .replace(/System\.out\.println\s*\(\s*([^)]+)\s*\)\s*;?/g, 'Console.WriteLine($1);')
    
    // Convert public static void main
    .replace(/public\s+static\s+void\s+main\s*\(\s*String\[\]\s+\w+\s*\)/g, 'static void Main(string[] args)')
    
    // Convert String to string
    .replace(/\bString\b/g, 'string')
    
    // Convert int to int (already compatible)
    // Convert boolean to bool
    .replace(/\bboolean\b/g, 'bool')
    
    // Add using statements if not present
    .replace(/^/, 'using System;\n\n');
}

// Python to Java translation
function pythonToJava(code: string): string {
  let javaCode = code
    // Print statements
    .replace(/print\s*\(\s*"([^"]+)"\s*\)/g, 'System.out.println("$1");')
    .replace(/print\s*\(\s*'([^']+)'\s*\)/g, 'System.out.println("$1");')
    .replace(/print\s*\(\s*([^)]+)\s*\)/g, 'System.out.println($1);')
    
    // Variable declarations with type inference
    .replace(/^(\s*)(\w+)\s*=\s*"([^"]*)"$/gm, '$1String $2 = "$3";')
    .replace(/^(\s*)(\w+)\s*=\s*'([^']*)'$/gm, '$1String $2 = "$3";')
    .replace(/^(\s*)(\w+)\s*=\s*(\d+)$/gm, '$1int $2 = $3;')
    .replace(/^(\s*)(\w+)\s*=\s*(\d+\.\d+)$/gm, '$1double $2 = $3;')
    .replace(/^(\s*)(\w+)\s*=\s*True$/gm, '$1boolean $2 = true;')
    .replace(/^(\s*)(\w+)\s*=\s*False$/gm, '$1boolean $2 = false;')
    .replace(/^(\s*)(\w+)\s*=\s*\[(.*?)\]$/gm, '$1ArrayList<Object> $2 = new ArrayList<>(Arrays.asList($3));')
    
    // Function definitions
    .replace(/def\s+(\w+)\s*\(([^)]*)\)\s*:/g, 'public static void $1($2) {')
    .replace(/^(\s*)return\s+(.+)$/gm, '$1return $2;')
    
    // Control structures
    .replace(/if\s+([^:]+?):/g, 'if ($1) {')
    .replace(/elif\s+([^:]+?):/g, '} else if ($1) {')
    .replace(/else\s*:/g, '} else {')
    .replace(/while\s+([^:]+?):/g, 'while ($1) {')
    
    // For loops
    .replace(/for\s+(\w+)\s+in\s+range\s*\(\s*(\d+)\s*\)\s*:/g, 'for (int $1 = 0; $1 < $2; $1++) {')
    .replace(/for\s+(\w+)\s+in\s+range\s*\(\s*(\d+),\s*(\d+)\s*\)\s*:/g, 'for (int $1 = $2; $1 < $3; $1++) {')
    
    // Boolean operators
    .replace(/\band\b/g, '&&')
    .replace(/\bor\b/g, '||')
    .replace(/\bnot\b/g, '!')
    .replace(/\bTrue\b/g, 'true')
    .replace(/\bFalse\b/g, 'false')
    .replace(/\bNone\b/g, 'null')
    
    // Comments
    .replace(/^\s*#\s*(.*?)$/gm, '// $1')
    
    // Add closing braces
    .split('\n')
    .map((line, index, lines) => {
      const currentIndent = line.match(/^\s*/)?.[0].length || 0;
      const nextIndent = lines[index + 1]?.match(/^\s*/)?.[0].length || 0;
      if (currentIndent > nextIndent && line.trim() && !line.trim().endsWith('{') && !line.trim().endsWith('}')) {
        return line + '\n' + ' '.repeat(nextIndent) + '}';
      }
      return line;
    })
    .join('\n');

  // Wrap in class and add imports
  return `import java.util.*;

public class PythonTranslation {
    public static void main(String[] args) {
${javaCode.split('\n').map(line => '        ' + line).join('\n')}
    }
}`;
}

// Python to C++ translation
function pythonToCpp(code: string): string {
  let cppCode = code
    // Print statements
    .replace(/print\s*\(\s*"([^"]+)"\s*\)/g, 'std::cout << "$1" << std::endl;')
    .replace(/print\s*\(\s*'([^']+)'\s*\)/g, 'std::cout << "$1" << std::endl;')
    .replace(/print\s*\(\s*([^)]+)\s*\)/g, 'std::cout << $1 << std::endl;')
    
    // Variable declarations
    .replace(/^(\s*)(\w+)\s*=\s*"([^"]*)"$/gm, '$1std::string $2 = "$3";')
    .replace(/^(\s*)(\w+)\s*=\s*'([^']*)'$/gm, '$1std::string $2 = "$3";')
    .replace(/^(\s*)(\w+)\s*=\s*(\d+)$/gm, '$1int $2 = $3;')
    .replace(/^(\s*)(\w+)\s*=\s*(\d+\.\d+)$/gm, '$1double $2 = $3;')
    .replace(/^(\s*)(\w+)\s*=\s*True$/gm, '$1bool $2 = true;')
    .replace(/^(\s*)(\w+)\s*=\s*False$/gm, '$1bool $2 = false;')
    
    // Control structures
    .replace(/if\s+([^:]+?):/g, 'if ($1) {')
    .replace(/elif\s+([^:]+?):/g, '} else if ($1) {')
    .replace(/else\s*:/g, '} else {')
    .replace(/while\s+([^:]+?):/g, 'while ($1) {')
    
    // For loops
    .replace(/for\s+(\w+)\s+in\s+range\s*\(\s*(\d+)\s*\)\s*:/g, 'for (int $1 = 0; $1 < $2; $1++) {')
    .replace(/for\s+(\w+)\s+in\s+range\s*\(\s*(\d+),\s*(\d+)\s*\)\s*:/g, 'for (int $1 = $2; $1 < $3; $1++) {')
    
    // Boolean operators
    .replace(/\band\b/g, '&&')
    .replace(/\bor\b/g, '||')
    .replace(/\bnot\b/g, '!')
    .replace(/\bTrue\b/g, 'true')
    .replace(/\bFalse\b/g, 'false')
    
    // Comments
    .replace(/^\s*#\s*(.*?)$/gm, '// $1')
    
    // Add closing braces
    .split('\n')
    .map((line, index, lines) => {
      const currentIndent = line.match(/^\s*/)?.[0].length || 0;
      const nextIndent = lines[index + 1]?.match(/^\s*/)?.[0].length || 0;
      if (currentIndent > nextIndent && line.trim() && !line.trim().endsWith('{') && !line.trim().endsWith('}')) {
        return line + '\n' + ' '.repeat(nextIndent) + '}';
      }
      return line;
    })
    .join('\n');

  // Add includes and main function
  return `#include <iostream>
#include <string>
#include <vector>

int main() {
${cppCode.split('\n').map(line => '    ' + line).join('\n')}
    return 0;
}`;
}

// Python to C translation
function pythonToC(code: string): string {
  let cCode = code
    // Print statements
    .replace(/print\s*\(\s*"([^"]+)"\s*\)/g, 'printf("$1\\n");')
    .replace(/print\s*\(\s*'([^']+)'\s*\)/g, 'printf("$1\\n");')
    .replace(/print\s*\(\s*([^)]+)\s*\)/g, 'printf("%d\\n", $1);')
    
    // Variable declarations
    .replace(/^(\s*)(\w+)\s*=\s*"([^"]*)"$/gm, '$1char $2[] = "$3";')
    .replace(/^(\s*)(\w+)\s*=\s*'([^']*)'$/gm, '$1char $2[] = "$3";')
    .replace(/^(\s*)(\w+)\s*=\s*(\d+)$/gm, '$1int $2 = $3;')
    .replace(/^(\s*)(\w+)\s*=\s*(\d+\.\d+)$/gm, '$1double $2 = $3;')
    
    // Control structures
    .replace(/if\s+([^:]+?):/g, 'if ($1) {')
    .replace(/elif\s+([^:]+?):/g, '} else if ($1) {')
    .replace(/else\s*:/g, '} else {')
    .replace(/while\s+([^:]+?):/g, 'while ($1) {')
    
    // For loops
    .replace(/for\s+(\w+)\s+in\s+range\s*\(\s*(\d+)\s*\)\s*:/g, 'for (int $1 = 0; $1 < $2; $1++) {')
    
    // Boolean operators
    .replace(/\band\b/g, '&&')
    .replace(/\bor\b/g, '||')
    .replace(/\bnot\b/g, '!')
    .replace(/\bTrue\b/g, '1')
    .replace(/\bFalse\b/g, '0')
    
    // Comments
    .replace(/^\s*#\s*(.*?)$/gm, '// $1')
    
    // Add closing braces
    .split('\n')
    .map((line, index, lines) => {
      const currentIndent = line.match(/^\s*/)?.[0].length || 0;
      const nextIndent = lines[index + 1]?.match(/^\s*/)?.[0].length || 0;
      if (currentIndent > nextIndent && line.trim() && !line.trim().endsWith('{') && !line.trim().endsWith('}')) {
        return line + '\n' + ' '.repeat(nextIndent) + '}';
      }
      return line;
    })
    .join('\n');

  return `#include <stdio.h>

int main() {
${cCode.split('\n').map(line => '    ' + line).join('\n')}
    return 0;
}`;
}

// Python to TypeScript translation
function pythonToTypeScript(code: string): string {
  return code
    // Print statements
    .replace(/print\s*\(\s*"([^"]+)"\s*\)/g, 'console.log("$1");')
    .replace(/print\s*\(\s*'([^']+)'\s*\)/g, "console.log('$1');")
    .replace(/print\s*\(\s*([^)]+)\s*\)/g, 'console.log($1);')
    
    // Variable declarations with types
    .replace(/^(\s*)(\w+)\s*=\s*"([^"]*)"$/gm, '$1let $2: string = "$3";')
    .replace(/^(\s*)(\w+)\s*=\s*'([^']*)'$/gm, "$1let $2: string = '$3';")
    .replace(/^(\s*)(\w+)\s*=\s*(\d+)$/gm, "$1let $2: number = $3;")
    .replace(/^(\s*)(\w+)\s*=\s*(\d+\.\d+)$/gm, "$1let $2: number = $3;")
    .replace(/^(\s*)(\w+)\s*=\s*True$/gm, "$1let $2: boolean = true;")
    .replace(/^(\s*)(\w+)\s*=\s*False$/gm, "$1let $2: boolean = false;")
    .replace(/^(\s*)(\w+)\s*=\s*None$/gm, "$1let $2: any = null;")
    .replace(/^(\s*)(\w+)\s*=\s*\[(.*?)\]$/gm, "$1let $2: any[] = [$3];")
    
    // Function definitions
    .replace(/def\s+(\w+)\s*\(([^)]*)\)\s*:/g, 'function $1($2): void {')
    .replace(/^(\s*)return\s+(.+)$/gm, '$1return $2;')
    
    // Control structures
    .replace(/if\s+([^:]+?):/g, 'if ($1) {')
    .replace(/elif\s+([^:]+?):/g, '} else if ($1) {')
    .replace(/else\s*:/g, '} else {')
    .replace(/while\s+([^:]+?):/g, 'while ($1) {')
    
    // For loops
    .replace(/for\s+(\w+)\s+in\s+range\s*\(\s*(\d+)\s*\)\s*:/g, 'for (let $1: number = 0; $1 < $2; $1++) {')
    .replace(/for\s+(\w+)\s+in\s+(.+?):/g, 'for (let $1 of $2) {')
    
    // Boolean operators
    .replace(/\band\b/g, '&&')
    .replace(/\bor\b/g, '||')
    .replace(/\bnot\b/g, '!')
    .replace(/\bTrue\b/g, 'true')
    .replace(/\bFalse\b/g, 'false')
    .replace(/\bNone\b/g, 'null')
    
    // Comments
    .replace(/^\s*#\s*(.*?)$/gm, '// $1')
    
    // Add closing braces
    .split('\n')
    .map((line, index, lines) => {
      const currentIndent = line.match(/^\s*/)?.[0].length || 0;
      const nextIndent = lines[index + 1]?.match(/^\s*/)?.[0].length || 0;
      if (currentIndent > nextIndent && line.trim() && !line.trim().endsWith('{') && !line.trim().endsWith('}')) {
        return line + '\n' + ' '.repeat(nextIndent) + '}';
      }
      return line;
    })
    .join('\n');
}

// Python to Go translation
function pythonToGo(code: string): string {
  let goCode = code
    // Print statements
    .replace(/print\s*\(\s*"([^"]+)"\s*\)/g, 'fmt.Println("$1")')
    .replace(/print\s*\(\s*'([^']+)'\s*\)/g, 'fmt.Println("$1")')
    .replace(/print\s*\(\s*([^)]+)\s*\)/g, 'fmt.Println($1)')
    
    // Variable declarations
    .replace(/^(\s*)(\w+)\s*=\s*"([^"]*)"$/gm, '$1$2 := "$3"')
    .replace(/^(\s*)(\w+)\s*=\s*'([^']*)'$/gm, '$1$2 := "$3"')
    .replace(/^(\s*)(\w+)\s*=\s*(\d+)$/gm, '$1$2 := $3')
    .replace(/^(\s*)(\w+)\s*=\s*(\d+\.\d+)$/gm, '$1$2 := $3')
    .replace(/^(\s*)(\w+)\s*=\s*True$/gm, '$1$2 := true')
    .replace(/^(\s*)(\w+)\s*=\s*False$/gm, '$1$2 := false')
    
    // Control structures
    .replace(/if\s+([^:]+?):/g, 'if $1 {')
    .replace(/elif\s+([^:]+?):/g, '} else if $1 {')
    .replace(/else\s*:/g, '} else {')
    .replace(/while\s+([^:]+?):/g, 'for $1 {')
    
    // For loops
    .replace(/for\s+(\w+)\s+in\s+range\s*\(\s*(\d+)\s*\)\s*:/g, 'for $1 := 0; $1 < $2; $1++ {')
    
    // Boolean operators
    .replace(/\band\b/g, '&&')
    .replace(/\bor\b/g, '||')
    .replace(/\bnot\b/g, '!')
    .replace(/\bTrue\b/g, 'true')
    .replace(/\bFalse\b/g, 'false')
    
    // Comments
    .replace(/^\s*#\s*(.*?)$/gm, '// $1')
    
    // Add closing braces
    .split('\n')
    .map((line, index, lines) => {
      const currentIndent = line.match(/^\s*/)?.[0].length || 0;
      const nextIndent = lines[index + 1]?.match(/^\s*/)?.[0].length || 0;
      if (currentIndent > nextIndent && line.trim() && !line.trim().endsWith('{') && !line.trim().endsWith('}')) {
        return line + '\n' + ' '.repeat(nextIndent) + '}';
      }
      return line;
    })
    .join('\n');

  return `package main

import "fmt"

func main() {
${goCode.split('\n').map(line => '    ' + line).join('\n')}
}`;
}

// Python to Ruby translation
function pythonToRuby(code: string): string {
  return code
    // Print statements
    .replace(/print\s*\(\s*"([^"]+)"\s*\)/g, 'puts "$1"')
    .replace(/print\s*\(\s*'([^']+)'\s*\)/g, "puts '$1'")
    .replace(/print\s*\(\s*([^)]+)\s*\)/g, 'puts $1')
    
    // Variable declarations (Ruby doesn't need declarations)
    .replace(/^(\s*)(\w+)\s*=\s*([^=\n]+)$/gm, '$1$2 = $3')
    
    // Function definitions
    .replace(/def\s+(\w+)\s*\(([^)]*)\)\s*:/g, 'def $1($2)')
    .replace(/^(\s*)return\s+(.+)$/gm, '$1return $2')
    
    // Control structures
    .replace(/if\s+([^:]+?):/g, 'if $1')
    .replace(/elif\s+([^:]+?):/g, 'elsif $1')
    .replace(/else\s*:/g, 'else')
    .replace(/while\s+([^:]+?):/g, 'while $1')
    
    // For loops
    .replace(/for\s+(\w+)\s+in\s+range\s*\(\s*(\d+)\s*\)\s*:/g, '$2.times do |$1|')
    .replace(/for\s+(\w+)\s+in\s+(.+?):/g, '$2.each do |$1|')
    
    // Boolean operators
    .replace(/\band\b/g, '&&')
    .replace(/\bor\b/g, '||')
    .replace(/\bnot\b/g, '!')
    .replace(/\bTrue\b/g, 'true')
    .replace(/\bFalse\b/g, 'false')
    .replace(/\bNone\b/g, 'nil')
    
    // Comments
    .replace(/^\s*#\s*(.*?)$/gm, '# $1')
    
    // Add end statements
    .split('\n')
    .map((line, index, lines) => {
      const currentIndent = line.match(/^\s*/)?.[0].length || 0;
      const nextIndent = lines[index + 1]?.match(/^\s*/)?.[0].length || 0;
      if (currentIndent > nextIndent && line.trim() && 
          (line.includes('if ') || line.includes('def ') || line.includes('while ') || 
           line.includes('times do') || line.includes('each do'))) {
        return line + '\n' + ' '.repeat(nextIndent) + 'end';
      }
      return line;
    })
    .join('\n');
}

// Python to PHP translation
function pythonToPhp(code: string): string {
  let phpCode = code
    // Print statements
    .replace(/print\s*\(\s*"([^"]+)"\s*\)/g, 'echo "$1";')
    .replace(/print\s*\(\s*'([^']+)'\s*\)/g, "echo '$1';")
    .replace(/print\s*\(\s*([^)]+)\s*\)/g, 'echo $1;')
    
    // Variable declarations (add $ prefix)
    .replace(/^(\s*)(\w+)\s*=\s*([^=\n]+)$/gm, '$1$$2 = $3;')
    
    // Function definitions
    .replace(/def\s+(\w+)\s*\(([^)]*)\)\s*:/g, 'function $1($2) {')
    .replace(/^(\s*)return\s+(.+)$/gm, '$1return $2;')
    
    // Control structures
    .replace(/if\s+([^:]+?):/g, 'if ($1) {')
    .replace(/elif\s+([^:]+?):/g, '} elseif ($1) {')
    .replace(/else\s*:/g, '} else {')
    .replace(/while\s+([^:]+?):/g, 'while ($1) {')
    
    // For loops
    .replace(/for\s+(\w+)\s+in\s+range\s*\(\s*(\d+)\s*\)\s*:/g, 'for ($$1 = 0; $$1 < $2; $$1++) {')
    
    // Boolean operators
    .replace(/\band\b/g, '&&')
    .replace(/\bor\b/g, '||')
    .replace(/\bnot\b/g, '!')
    .replace(/\bTrue\b/g, 'true')
    .replace(/\bFalse\b/g, 'false')
    .replace(/\bNone\b/g, 'null')
    
    // Comments
    .replace(/^\s*#\s*(.*?)$/gm, '// $1')
    
    // Add closing braces
    .split('\n')
    .map((line, index, lines) => {
      const currentIndent = line.match(/^\s*/)?.[0].length || 0;
      const nextIndent = lines[index + 1]?.match(/^\s*/)?.[0].length || 0;
      if (currentIndent > nextIndent && line.trim() && !line.trim().endsWith('{') && !line.trim().endsWith('}')) {
        return line + '\n' + ' '.repeat(nextIndent) + '}';
      }
      return line;
    })
    .join('\n');

  return `<?php
${phpCode}
?>`;
}

// Python to Swift translation
function pythonToSwift(code: string): string {
  return code
    // Print statements
    .replace(/print\s*\(\s*"([^"]+)"\s*\)/g, 'print("$1")')
    .replace(/print\s*\(\s*'([^']+)'\s*\)/g, 'print("$1")')
    .replace(/print\s*\(\s*([^)]+)\s*\)/g, 'print($1)')
    
    // Variable declarations
    .replace(/^(\s*)(\w+)\s*=\s*"([^"]*)"$/gm, '$1var $2 = "$3"')
    .replace(/^(\s*)(\w+)\s*=\s*'([^']*)'$/gm, '$1var $2 = "$3"')
    .replace(/^(\s*)(\w+)\s*=\s*(\d+)$/gm, '$1var $2 = $3')
    .replace(/^(\s*)(\w+)\s*=\s*(\d+\.\d+)$/gm, '$1var $2 = $3')
    .replace(/^(\s*)(\w+)\s*=\s*True$/gm, '$1var $2 = true')
    .replace(/^(\s*)(\w+)\s*=\s*False$/gm, '$1var $2 = false')
    
    // Function definitions
    .replace(/def\s+(\w+)\s*\(([^)]*)\)\s*:/g, 'func $1($2) {')
    .replace(/^(\s*)return\s+(.+)$/gm, '$1return $2')
    
    // Control structures
    .replace(/if\s+([^:]+?):/g, 'if $1 {')
    .replace(/elif\s+([^:]+?):/g, '} else if $1 {')
    .replace(/else\s*:/g, '} else {')
    .replace(/while\s+([^:]+?):/g, 'while $1 {')
    
    // For loops
    .replace(/for\s+(\w+)\s+in\s+range\s*\(\s*(\d+)\s*\)\s*:/g, 'for $1 in 0..<$2 {')
    .replace(/for\s+(\w+)\s+in\s+(.+?):/g, 'for $1 in $2 {')
    
    // Boolean operators
    .replace(/\band\b/g, '&&')
    .replace(/\bor\b/g, '||')
    .replace(/\bnot\b/g, '!')
    .replace(/\bTrue\b/g, 'true')
    .replace(/\bFalse\b/g, 'false')
    .replace(/\bNone\b/g, 'nil')
    
    // Comments
    .replace(/^\s*#\s*(.*?)$/gm, '// $1')
    
    // Add closing braces
    .split('\n')
    .map((line, index, lines) => {
      const currentIndent = line.match(/^\s*/)?.[0].length || 0;
      const nextIndent = lines[index + 1]?.match(/^\s*/)?.[0].length || 0;
      if (currentIndent > nextIndent && line.trim() && !line.trim().endsWith('{') && !line.trim().endsWith('}')) {
        return line + '\n' + ' '.repeat(nextIndent) + '}';
      }
      return line;
    })
    .join('\n');
}

// Python to C# translation
function pythonToCSharp(code: string): string {
  let csharpCode = code
    // Print statements
    .replace(/print\s*\(\s*"([^"]+)"\s*\)/g, 'Console.WriteLine("$1");')
    .replace(/print\s*\(\s*'([^']+)'\s*\)/g, 'Console.WriteLine("$1");')
    .replace(/print\s*\(\s*([^)]+)\s*\)/g, 'Console.WriteLine($1);')
    
    // Variable declarations
    .replace(/^(\s*)(\w+)\s*=\s*"([^"]*)"$/gm, '$1string $2 = "$3";')
    .replace(/^(\s*)(\w+)\s*=\s*'([^']*)'$/gm, '$1string $2 = "$3";')
    .replace(/^(\s*)(\w+)\s*=\s*(\d+)$/gm, '$1int $2 = $3;')
    .replace(/^(\s*)(\w+)\s*=\s*(\d+\.\d+)$/gm, '$1double $2 = $3;')
    .replace(/^(\s*)(\w+)\s*=\s*True$/gm, '$1bool $2 = true;')
    .replace(/^(\s*)(\w+)\s*=\s*False$/gm, '$1bool $2 = false;')
    
    // Function definitions
    .replace(/def\s+(\w+)\s*\(([^)]*)\)\s*:/g, 'public static void $1($2) {')
    .replace(/^(\s*)return\s+(.+)$/gm, '$1return $2;')
    
    // Control structures
    .replace(/if\s+([^:]+?):/g, 'if ($1) {')
    .replace(/elif\s+([^:]+?):/g, '} else if ($1) {')
    .replace(/else\s*:/g, '} else {')
    .replace(/while\s+([^:]+?):/g, 'while ($1) {')
    
    // For loops
    .replace(/for\s+(\w+)\s+in\s+range\s*\(\s*(\d+)\s*\)\s*:/g, 'for (int $1 = 0; $1 < $2; $1++) {')
    
    // Boolean operators
    .replace(/\band\b/g, '&&')
    .replace(/\bor\b/g, '||')
    .replace(/\bnot\b/g, '!')
    .replace(/\bTrue\b/g, 'true')
    .replace(/\bFalse\b/g, 'false')
    .replace(/\bNone\b/g, 'null')
    
    // Comments
    .replace(/^\s*#\s*(.*?)$/gm, '// $1')
    
    // Add closing braces
    .split('\n')
    .map((line, index, lines) => {
      const currentIndent = line.match(/^\s*/)?.[0].length || 0;
      const nextIndent = lines[index + 1]?.match(/^\s*/)?.[0].length || 0;
      if (currentIndent > nextIndent && line.trim() && !line.trim().endsWith('{') && !line.trim().endsWith('}')) {
        return line + '\n' + ' '.repeat(nextIndent) + '}';
      }
      return line;
    })
    .join('\n');

  return `using System;

class Program {
    static void Main() {
${csharpCode.split('\n').map(line => '        ' + line).join('\n')}
    }
}`;
}

function genericTranslation(code: string, sourceLanguage: Language, targetLanguage: Language): string {
  // For unsupported language pairs, provide a template with guidance
  return `// Rule-based translation from ${sourceLanguage.name} to ${targetLanguage.name}
// Manual conversion required for complex syntax
// Original ${sourceLanguage.name} code:

${code.split('\n').map(line => `// ${line}`).join('\n')}

// TODO: Convert the above ${sourceLanguage.name} code to ${targetLanguage.name}
// This is a basic fallback - for better translation:
// 1. Use the language-specific converters for Python
// 2. Check the language templates for boilerplate code`;
}
