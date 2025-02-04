import { Fragment } from 'react'
import { Popover, Transition } from '@headlessui/react'

interface CourseDescription {
  code: string;
  title?: string;
  units?: number;
  description?: string;
  prerequisites?: string;
}

interface CourseTooltipProps {
  children: React.ReactNode;
  description: CourseDescription | null;
}

export default function CourseTooltip({ children, description }: CourseTooltipProps) {
  if (!description) {
    return <>{children}</>;
  }

  return (
    <Popover className="relative inline-block">
      {({ open }) => (
        <>
          <Popover.Button className={`outline-none ${open ? 'text-yellow-400' : ''} transition-colors duration-200`}>
            {children}
          </Popover.Button>
          <Transition
            as={Fragment}
            enter="transition ease-out duration-200"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="transition ease-in duration-150"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <Popover.Panel static>
              {({ close }) => (
                <div 
                  className="fixed inset-0 z-[9999]" 
                  onClick={() => close()}
                  style={{ pointerEvents: 'none' }}
                >
                  <div className="flex min-h-full items-center justify-center p-4 text-center">
                    <div 
                      className="relative transform overflow-hidden rounded-lg shadow-[0_0_20px_-3px_rgba(0,0,0)] ring-1 ring-black ring-opacity-5 outline outline-white bg-gray-800 p-4 w-screen max-w-sm"
                      style={{
                        position: 'absolute',
                        left: '50%',
                        top: '50%',
                        transform: 'translate(-50%, -50%)',
                        pointerEvents: 'auto'
                      }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                          <span className="text-lg font-medium text-yellow-400">{description.code}</span>
                          {description.units && (
                            <span className="text-sm text-gray-400">{description.units} units</span>
                          )}
                        </div>
                        {description.title && (
                          <p className="text-sm font-medium text-gray-300">{description.title}</p>
                        )}
                        {description.description && (
                          <p className="text-sm text-white text-left">{description.description}</p>
                        )}
                        {description.prerequisites && (
                          <p className="text-sm text-gray-400 italic text-left">{description.prerequisites}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </Popover.Panel>
          </Transition>
        </>
      )}
    </Popover>
  )
}