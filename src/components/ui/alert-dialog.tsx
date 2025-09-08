import React, { useState } from 'react';

// A simple utility to conditionally join Tailwind CSS classes.
function cn(...classes) {
  return classes.filter(Boolean).join(' ');
}

// Simple button styles, replicating the component library's variants.
const buttonVariants = (variant = 'default') => {
  const base = "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 h-9 px-4 py-2";
  const variants = {
    default: "bg-gray-900 text-gray-50 shadow hover:bg-gray-900/90",
    outline: "border border-gray-200 bg-white shadow-sm hover:bg-gray-100 hover:text-gray-900",
  };
  return cn(base, variants[variant]);
};

// The main AlertDialog component that manages the open state.
const AlertDialog = ({ children }) => {
  const [open, setOpen] = useState(false);
  const clones = React.Children.map(children, (child) => {
    if (React.isValidElement(child)) {
      return React.cloneElement(child, {
        open,
        setOpen,
      });
    }
    return child;
  });

  return <>{clones}</>;
};

// The trigger button that opens the dialog.
const AlertDialogTrigger = ({ children, setOpen }) => (
  <button onClick={() => setOpen(true)} className={buttonVariants()}>
    {children}
  </button>
);
AlertDialogTrigger.displayName = "AlertDialogTrigger";

// The overlay and content container for the dialog.
const AlertDialogContent = ({ open, setOpen, children }) => {
  if (!open) return null;

  // Clone children to pass down the setOpen function to action/cancel buttons.
  const clonedChildren = React.Children.map(children, (child) => {
    if (React.isValidElement(child) && ['AlertDialogAction', 'AlertDialogCancel'].includes(child.type.displayName)) {
      return React.cloneElement(child, { setOpen });
    }
    return child;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/80 animate-in fade-in-0" onClick={() => setOpen(false)} />
      
      {/* Content */}
      <div className="relative z-50 grid w-full max-w-lg gap-4 rounded-lg border bg-white p-6 shadow-lg animate-in zoom-in-95 data-[state=open]:slide-in-from-top-[48%]">
        {clonedChildren}
      </div>
    </div>
  );
};
AlertDialogContent.displayName = "AlertDialogContent";

// Header for the dialog content.
const AlertDialogHeader = ({ className, children }) => (
  <div className={cn("flex flex-col space-y-2 text-center sm:text-left", className)}>
    {children}
  </div>
);
AlertDialogHeader.displayName = "AlertDialogHeader";

// Footer for the dialog content.
const AlertDialogFooter = ({ className, children }) => (
  <div className={cn("flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2", className)}>
    {children}
  </div>
);
AlertDialogFooter.displayName = "AlertDialogFooter";

// Title for the dialog.
const AlertDialogTitle = ({ className, children }) => (
  <h2 className={cn("text-lg font-semibold text-black", className)}>
    {children}
  </h2>
);
AlertDialogTitle.displayName = "AlertDialogTitle";

// Description for the dialog.
const AlertDialogDescription = ({ className, children }) => (
  <p className={cn("text-sm text-black", className)}>
    {children}
  </p>
);
AlertDialogDescription.displayName = "AlertDialogDescription";

// Action button for the dialog.
const AlertDialogAction = ({ className, children, setOpen }) => (
  <button onClick={() => setOpen(false)} className={cn(buttonVariants(), className)}>
    {children}
  </button>
);
AlertDialogAction.displayName = "AlertDialogAction";

// Cancel button for the dialog.
const AlertDialogCancel = ({ className, children, setOpen }) => (
  <button onClick={() => setOpen(false)} className={cn(buttonVariants('outline'), "mt-2 sm:mt-0", className)}>
    {children}
  </button>
);
AlertDialogCancel.displayName = "AlertDialogCancel";

// Main application component to demonstrate the AlertDialog.
export default function App() {
  const handleAction = () => {
    console.log("Action confirmed!");
    // In a real app, you would perform an action here.
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
      <AlertDialog>
        <AlertDialogTrigger>Show Alert Dialog</AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your account and remove your data from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleAction}>Continue</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
