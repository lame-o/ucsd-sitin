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
      <Popover.Button className="outline-none">
        {children}
      </Popover.Button>
      <Transition
        as={Fragment}
        enter="transition ease-out duration-200"
        enterFrom="opacity-0 translate-y-1"
        enterTo="opacity-100 translate-y-0"
        leave="transition ease-in duration-150"
        leaveFrom="opacity-100 translate-y-0"
        leaveTo="opacity-0 translate-y-1"
      >
        <Popover.Panel className="absolute left-1/2 z-10 mt-3 w-screen max-w-sm -translate-x-1/2 transform px-4">
          <div className="overflow-hidden rounded-lg shadow-lg ring-1 ring-black ring-opacity-5">
            <div className="relative bg-gray-800 p-4">
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-lg font-medium text-gray-100">{description.code}</span>
                  {description.units && (
                    <span className="text-sm text-gray-400">{description.units} units</span>
                  )}
                </div>
                {description.title && (
                  <p className="text-sm font-medium text-gray-300">{description.title}</p>
                )}
                {description.description && (
                  <p className="text-sm text-gray-400">{description.description}</p>
                )}
                {description.prerequisites && (
                  <p className="text-sm text-gray-500 italic">{description.prerequisites}</p>
                )}
              </div>
            </div>
          </div>
        </Popover.Panel>
      </Transition>
    </Popover>
  )
}