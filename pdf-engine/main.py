
import sys
import os
import argparse
import json

# Add current directory to path so we can import modules
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

def main():
    parser = argparse.ArgumentParser(description='PDF Baba Engine')
    parser.add_argument('tool', help='Tool to run (merge, split, compress, test)')
    # Note: Using nargs='*' or similar for inputs because main.py structure in user request was slightly different
    # But I must adapt to existing calling convention where first arg is tool.
    # The user provided a main.py that uses 'input' and 'output' as positional args, but existing main.py uses 'tool' then args.
    # I will stick to the wrapper logic I created earlier but adapt the COMPRESS block content to match user logic.
    
    parser.add_argument('--inputs', nargs='+', help='Input files', required=False)
    parser.add_argument('--output', help='Output file', required=False)
    parser.add_argument('--params', help='JSON string of additional parameters', required=False)
    
    parser.add_argument('--target-size', type=float, help='Target size in KB')
    parser.add_argument('--quality', type=str, help='Quality preset')
    parser.add_argument('--debug', action='store_true', help='Enable debug output')

    args = parser.parse_args()

    try:
        # TEST TOOL
        if args.tool == 'test':
            print(json.dumps({"status": "ok", "message": "Engine is ready"}))
            return
            
        # PREVIEW TOOL
        elif args.tool == 'preview':
            if not args.inputs:
                raise Exception("Preview requires --inputs")
            from tools.merge.preview import PDFPreviewGenerator
            generator = PDFPreviewGenerator()
            
            # Assuming generate_thumbnail takes the first input file
            result = generator.generate_thumbnail(args.inputs[0])
            print(json.dumps(result))
            return
            
        # MERGE TOOL
        elif args.tool == 'merge':
            if not args.inputs or not args.output:
                raise Exception("Merge requires --inputs and --output")
            
            from tools.merge.merger import AdvancedPDFMerger
            
            # Parse params
            properties = {}
            if args.params:
                try:
                    properties = json.loads(args.params)
                except:
                    pass
            
            order = properties.get('order')
            
            merger = AdvancedPDFMerger(debug=args.debug)
            result = merger.merge_with_properties(
                file_paths=args.inputs,
                output_path=args.output,
                order=order,
                properties=properties
            )
            
            if result['success']:
                print(json.dumps({
                    "status": "success",
                    "tool": "merge",
                    "output": args.output,
                    "stats": {
                        "filesMerged": result['files_merged'],
                        "totalPages": result['total_pages'],
                        "outputSizeKB": result['output_size_kb']
                    }
                }))
            else:
                 print(json.dumps({"status": "error", "message": result.get('error')}))
            return

        # SPLIT TOOL
        elif args.tool == 'split':
            if not args.inputs or not args.output:
                raise Exception("Split requires --inputs and --output")
            
            from tools.split.splitter import PDFSplitter
            
            properties = {}
            if args.params:
                try:
                    properties = json.loads(args.params)
                except:
                    pass
            
            range_str = properties.get('range', '1-end')
            
            splitter = PDFSplitter(debug=args.debug)
            result = splitter.split_by_range(
                input_path=args.inputs[0],
                output_path=args.output,
                range_str=range_str,
                properties=properties
            )
            
            if result['success']:
                print(json.dumps({
                    "status": "success",
                    "tool": "split",
                    "output": args.output,
                    "stats": {
                        "totalPages": result['total_pages'],
                        "outputSizeKB": result['output_size_kb']
                    }
                }))
            else:
                print(json.dumps({"status": "error", "message": result.get('error')}))
            return

        # COMPRESS TOOL (New Modular Engine)
        if args.tool == 'compress':
            if not args.inputs or not args.output:
                 raise Exception("Compress requires --inputs and --output")
            
            from core.compressor import PDFCompressor
            from core.analyzer import PDFAnalyzer
            from core.validator import PDFValidator
            
            # Parse params (JSON) if provided, but CLI args take precedence
            params_dict = {}
            if args.params:
                try:
                    params_dict = json.loads(args.params)
                except:
                    pass
            
            # Resolve arguments
            # target_kb can come from CLI --target-size OR params JSON 'target_size_kb'
            target_kb_arg = args.target_size if args.target_size else params_dict.get('target_size_kb')
            quality = args.quality if args.quality else params_dict.get('quality', 'medium')
            
            compressor = PDFCompressor(debug=args.debug)
            
            # Get original size
            original_size_kb = os.path.getsize(args.inputs[0]) / 1024
            
            # Analyze PDF (Optional, just pass None if simple mode)
            analysis = None 
            try:
                analyzer = PDFAnalyzer()
                analysis = analyzer.analyze(args.inputs[0])
            except:
                pass # Don't let analysis fail the whole process
            
            # --- FIXED TARGET SIZE LOGIC ---
            target_kb = None
            if target_kb_arg is not None:
                try:
                    target_kb = float(target_kb_arg)
                except ValueError:
                    target_kb = None
            
            if target_kb is None:
                # Default logic usually handled inside compressor, but passing None is fine
                pass

            # Validate target is reasonable if set
            if target_kb and target_kb > 0:
                min_safe_kb = 50 # Hardcoded safe limit for CLI validation
                if target_kb < min_safe_kb:
                    target_kb = min_safe_kb
            
            if args.debug:
                 print(f"[DEBUG] CLI Target: {target_kb}")

            # Run compression
            result = compressor.compress(
                input_path=args.inputs[0],
                output_path=args.output,
                target_size_kb=target_kb, # explicit named arg
                quality=quality,
                analysis=analysis
            )
            
            if result['success']:
                # Return JSON as expected by API
                print(json.dumps({
                    "status": "success",
                    "tool": "compress",
                    "output": args.output,
                    "stats": {
                        "originalSize": result.get('original_size_kb'),
                        "compressedSize": result.get('compressed_size_kb'),
                        "reduction": result.get('reduction_percent')
                    }
                }))
            else:
                print(json.dumps({
                    "status": "error", 
                    "message": result.get('error', 'Compression failed')
                }))
            return

        # ANALYZE TOOL
        elif args.tool == 'analyze':
            if not args.inputs:
                raise Exception("Analyze requires --inputs")
            
            try:
                import fitz
                doc = fitz.open(args.inputs[0])
                count = len(doc)
                doc.close()
                print(json.dumps({
                    "status": "success",
                    "tool": "analyze",
                    "stats": {
                        "totalPages": count
                    }
                }))
            except Exception as e:
                 print(json.dumps({"status": "error", "message": str(e)}))
            return

        # IMAGE TO PDF TOOL
        elif args.tool == 'image-to-pdf':
            if not args.inputs or not args.output:
                raise Exception("Image-to-PDF requires --inputs and --output")
            
            from tools.convert.image_to_pdf import ImageToPdfConverter
            
            properties = {}
            if args.params:
                try:
                    properties = json.loads(args.params)
                except:
                    pass
            
            converter = ImageToPdfConverter(debug=args.debug)
            result = converter.convert(
                image_paths=args.inputs,
                output_path=args.output,
                params=properties
            )
            
            if result['success']:
                print(json.dumps({
                    "status": "success",
                    "tool": "image-to-pdf",
                    "output": args.output,
                    "stats": {
                        "totalPages": len(properties.get('pages', args.inputs)), # Approx
                        "outputSizeKB": result['output_size_kb']
                    }
                }))
            else:
                 print(json.dumps({"status": "error", "message": "Conversion failed"}))
            return
        
        # PDF TO IMAGE TOOL
        elif args.tool == 'pdf-to-image':
            if not args.inputs or not args.output:
                raise Exception("Pdf-to-Image requires --inputs and --output (directory)")
            
            from tools.convert.pdf_to_image import convert_pdf_to_images
            
            properties = {}
            if args.params:
                try:
                    properties = json.loads(args.params)
                except:
                    pass
            
            # Extract properties
            fmt = properties.get('format', 'jpg')
            dpi = int(properties.get('dpi', 150))
            color = properties.get('color', 'color')
            pages = properties.get('pages', 'all')
            
            result = convert_pdf_to_images(
                input_path=args.inputs[0],
                output_dir=args.output,
                fmt=fmt,
                dpi=dpi,
                color_mode=color,
                page_range=pages
            )
            
            if result['success']:
                print(json.dumps({
                    "status": "success",
                    "tool": "pdf-to-image",
                    "files": result['files'],
                    "stats": {
                        "totalConverted": result['total_converted']
                    }
                }))
            else:
                 print(json.dumps({"status": "error", "message": result.get('error', "Conversion failed")}))
            return

        # PDF TO WORD TOOL
        elif args.tool == 'pdf-to-word':
            if not args.inputs or not args.output:
                raise Exception("Pdf-to-Word requires --inputs and --output")
            
            from tools.convert.pdf_to_word import convert_pdf_to_word
            
            properties = {}
            if args.params:
                try:
                    properties = json.loads(args.params)
                except:
                    pass
            
            pages = properties.get('pages', 'all')
            
            result = convert_pdf_to_word(
                input_path=args.inputs[0],
                output_path=args.output,
                pages=pages
            )
            
            if result['success']:
                 print(json.dumps({
                    "status": "success", 
                    "tool": "pdf-to-word",
                    "output": args.output
                 }))
            else:
                 print(json.dumps({"status": "error", "message": result.get('error', "Conversion failed")}))
            return

        # PROTECT TOOL
        elif args.tool == 'protect':
            if not args.inputs or not args.output:
                raise Exception("Protect requires --inputs and --output")
            
            from tools.security.protector import PDFProtector
            
            properties = {}
            if args.params:
                try:
                    properties = json.loads(args.params)
                except:
                    pass
            
            user_password = properties.get('user_password')
            if not user_password:
                raise Exception("User password is required")
                
            owner_password = properties.get('owner_password')
            permissions = properties.get('permissions')
            encryption = properties.get('encryption', 'AES-256')
            
            protector = PDFProtector(debug=args.debug)
            result = protector.protect(
                input_path=args.inputs[0],
                output_path=args.output,
                user_password=user_password,
                owner_password=owner_password,
                permissions=permissions,
                encryption_level=encryption
            )
            
            if result['success']:
                 print(json.dumps({
                    "status": "success", 
                    "tool": "protect",
                    "output": args.output
                 }))
            else:
                 print(json.dumps({"status": "error", "message": result.get('error', "Protection failed")}))
            return

        print(json.dumps({"status": "error", "message": f"Tool {args.tool} not implemented"}))

    except Exception as e:
        print(json.dumps({"status": "error", "message": str(e)}))
        sys.exit(1)

if __name__ == "__main__":
    main()
