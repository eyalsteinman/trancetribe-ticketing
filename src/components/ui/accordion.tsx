import React, { useState, useRef, useEffect } from 'react';

// A simple utility to conditionally join Tailwind CSS classes.
function cn(...classes) {
  return classes.filter(Boolean).join(' ');
}

// An inline SVG for the ChevronDown icon, replacing the external dependency.
const ChevronDown = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="m6 9 6 6 6-6" />
  </svg>
);

// The main Accordion component that manages the open state of its children.
const Accordion = ({ children, type = 'single', defaultValue, collapsible = false }) => {
  const [openItem, setOpenItem] = useState(defaultValue || null);

  const handleToggle = (value) => {
    setOpenItem((prev) => {
      if (prev === value) {
        return collapsible ? null : prev;
      }
      return value;
    });
  };

  const clones = React.Children.map(children, (child) => {
    if (React.isValidElement(child) && child.type.displayName === 'AccordionItem') {
      return React.cloneElement(child, {
        open: openItem === child.props.value,
        onToggle: () => handleToggle(child.props.value),
      });
    }
    return child;
  });

  return (
    <div className="w-full">
      {clones}
    </div>
  );
};

// AccordionItem component to wrap the trigger and content.
const AccordionItem = ({ children, open, onToggle, value }) => {
  const clonedChildren = React.Children.map(children, (child) => {
    if (React.isValidElement(child)) {
      if (child.type.displayName === 'AccordionTrigger') {
        return React.cloneElement(child, {
          onClick: onToggle,
          open: open,
        });
      }
      if (child.type.displayName === 'AccordionContent') {
        return React.cloneElement(child, {
          open: open,
        });
      }
    }
    return child;
  });

  return (
    <div className="border-b border-gray-200">
      {clonedChildren}
    </div>
  );
};
AccordionItem.displayName = "AccordionItem";

// AccordionTrigger component that handles the click and icon rotation.
const AccordionTrigger = ({ children, onClick, open }) => (
  <button
    onClick={onClick}
    className="flex flex-1 items-center justify-between w-full py-4 font-medium transition-all hover:underline"
  >
    {children}
    <ChevronDown
      className={cn(
        "h-4 w-4 shrink-0 transition-transform duration-200",
        open ? "rotate-180" : ""
      )}
    />
  </button>
);
AccordionTrigger.displayName = "AccordionTrigger";

// AccordionContent component that expands and collapses.
const AccordionContent = ({ children, open }) => {
  const contentRef = useRef(null);
  const [height, setHeight] = useState('0px');

  useEffect(() => {
    if (open) {
      setHeight(`${contentRef.current.scrollHeight}px`);
    } else {
      setHeight('0px');
    }
  }, [open]);

  return (
    <div
      ref={contentRef}
      style={{ height }}
      className="overflow-hidden text-sm transition-all duration-300 ease-in-out"
    >
      <div className="pb-4 pt-0">
        {children}
      </div>
    </div>
  );
};
AccordionContent.displayName = "AccordionContent";

// Main application component to demonstrate the Accordion.
export default function App() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
      <div className="w-full max-w-2xl bg-white rounded-lg shadow-xl p-6">
        <h1 className="text-2xl font-bold mb-6 text-center text-gray-800">Frequently Asked Questions</h1>
        <Accordion type="single" collapsible>
          <AccordionItem value="item-1">
            <AccordionTrigger>What is React?</AccordionTrigger>
            <AccordionContent>
              React is a free and open-source front-end JavaScript library for building user interfaces based on UI components. It is maintained by Meta and a community of individual developers and companies.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-2">
            <AccordionTrigger>What is Tailwind CSS?</AccordionTrigger>
            <AccordionContent>
              Tailwind CSS is an open-source CSS framework. It provides utility-first classes that can be used to style websites by directly applying the classes to HTML elements, allowing for rapid UI development.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-3">
            <AccordionTrigger>What is an accordion component?</AccordionTrigger>
            <AccordionContent>
              An accordion is a vertical stack of interactive headings or summaries that can be expanded to reveal their associated content. This UI pattern is commonly used to manage information density and present complex information in a structured way.
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </div>
  );
}
