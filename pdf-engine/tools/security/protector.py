
import os
from pypdf import PdfReader, PdfWriter
from pypdf.constants import UserAccessPermissions

class PDFProtector:
    def __init__(self, debug=False):
        self.debug = debug

    def protect(self, input_path, output_path, user_password, owner_password=None, 
                permissions=None, encryption_level="AES-256"):
        """
        Protects a PDF with password and permissions.
        
        Args:
            input_path (str): Path to input PDF
            output_path (str): Path to output PDF
            user_password (str): Password to open the PDF
            owner_password (str): Password to change permissions (defaults to user_password if None)
            permissions (dict): Dictionary of permissions flags
            encryption_level (str): "AES-256", "AES-128", "RC4-128"
        """
        try:
            reader = PdfReader(input_path)
            writer = PdfWriter()

            # Copy all pages
            writer.append_pages_from_reader(reader)
            
            # Copy specific meta-data? Usually pypdf handles it, but let's be safe
            if reader.metadata:
                writer.add_metadata(reader.metadata)

            # --- Permission Flags Calculation ---
            # Default is everything allowed if no permissions restricted
            # If providing permissions, we usually start with 0 (restricted) and add allowed
            # OR start with all and subtract.
            # pypdf encrypt takes a bitmask.
            
            # Simplified mapping from user specs to pypdf permissions
            # Using valid pypdf permission flags logic
            
            perms_flag = UserAccessPermissions.PRINT | UserAccessPermissions.MODIFY | UserAccessPermissions.COPY | UserAccessPermissions.ANNOTATE | UserAccessPermissions.FILL_FORMS | UserAccessPermissions.EXTRACT | UserAccessPermissions.ASSEMBLE | UserAccessPermissions.PRINT_TO_REPRESENTATION
            
            # If user passed explicit permissions, we might need to restrict them
            # However, pypdf's expected `permissions_flag` argument is a bitmask of ALLOWED actions.
            
            if permissions:
                # Start with nothing allowed
                perms_flag = 0 
                
                # Printing
                print_perm = permissions.get('printing', 'high') # none, low, high
                if print_perm == 'high':
                    perms_flag |= UserAccessPermissions.PRINT
                    perms_flag |= UserAccessPermissions.PRINT_TO_REPRESENTATION # High quality
                elif print_perm == 'low':
                    perms_flag |= UserAccessPermissions.PRINT # Just print (low res often implied if high not set, depending on viewer)
                
                # Modifying
                mod_perm = permissions.get('modifying', 'all') # none, minimal, all
                if mod_perm == 'all':
                    perms_flag |= UserAccessPermissions.MODIFY
                    perms_flag |= UserAccessPermissions.ASSEMBLE
                    perms_flag |= UserAccessPermissions.ANNOTATE
                    perms_flag |= UserAccessPermissions.FILL_FORMS
                elif mod_perm == 'minimal':
                    # "Insert, delete, rotate pages" -> ASSEMBLE
                    # "fill forms" -> FILL_FORMS
                    perms_flag |= UserAccessPermissions.ASSEMBLE
                    perms_flag |= UserAccessPermissions.FILL_FORMS
                    perms_flag |= UserAccessPermissions.ANNOTATE # often grouped
                
                # Copying
                copy_perm = permissions.get('copying', True)
                if copy_perm:
                     perms_flag |= UserAccessPermissions.COPY
                     perms_flag |= UserAccessPermissions.EXTRACT
                
                # Annotating (if separate)
                annot_perm = permissions.get('annotating', True)
                if annot_perm:
                    perms_flag |= UserAccessPermissions.ANNOTATE
                    perms_flag |= UserAccessPermissions.FILL_FORMS

            # --- Encryption Algorithm ---
            algo = encryption_level
            if algo not in ["AES-256", "AES-128", "RC4-128"]:
                algo = "AES-256" # Default

            if self.debug:
                print(f"Encrypting with {algo}, Permissions: {perms_flag}")

            # Encrypt
            writer.encrypt(
                user_password=user_password,
                owner_password=owner_password,
                permissions_flag=perms_flag,
                algorithm=algo
            )

            # Write output
            with open(output_path, "wb") as f:
                writer.write(f)

            return {
                "success": True,
                "output_path": output_path
            }

        except Exception as e:
            if self.debug:
                import traceback
                traceback.print_exc()
            return {
                "success": False,
                "error": str(e)
            }
