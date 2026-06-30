import { Fragment } from "react";
import { Dialog, DialogPanel, Transition } from "@headlessui/react";
import { useForm } from "react-hook-form";

const Modal = ({ isOpen, onClose, title, children, width = "max-w-md" }) => {
  const {
    register,
    handleSubmit,
    clearErrors,
    formState: { errors },
  } = useForm();

  const formFields = [
    {
      id: "name",
      label: "Name",
      PlaceHolder: "Enter Your Name",
      type: "text",
      required: true,
    },
    {
      id: "email",
      label: "Email",
      PlaceHolder: "Enter Your Email",
      type: "email",
      required: true,
    },
    {
      id: "about",
      label: "About",
      PlaceHolder: "Enter About Yourself",
      type: "text",
      required: true,
    },
   
  ];


const onSubmit = (data) => {
    console.log(data);
    // onClose(); // Close the modal after submission
  }

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        {/* Backdrop */}
        <Transition.Child
          as={Fragment}
          enter="duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" />
        </Transition.Child>

        {/* Modal */}
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Transition.Child
            as={Fragment}
            enter="duration-300"
            enterFrom="opacity-0 scale-95"
            enterTo="opacity-100 scale-100"
            leave="duration-200"
            leaveFrom="opacity-100 scale-100"
            leaveTo="opacity-0 scale-95"
          >
            <DialogPanel
              className={`w-full ${width} bg-white rounded-2xl shadow-2xl overflow-hidden`}
            >
              {/* Header */}
              <div className="flex flex-col justify-between items-center p-5 border-b">
               
                <div className="flex  justify-between w-full bg-red-200">
 <h2 className="font-bold text-lg">{title}</h2>
 <button
                  onClick={onClose}
                  className="w-8 h-8 rounded-lg hover:bg-gray-100"
                >
                  ✕
                </button>
                </div>

                <div>
                  <form onSubmit={handleSubmit(onSubmit)}>
                    {formFields.map((field,index) => {
                      if (field.type === "text"|| field.type === "email" || field.type === "password"||field.type === "number") {
                        return (
                          <div key={index}>
                            <label
                              htmlFor={field.id}
                              className="block text-sm font-medium text-gray-700"
                            >
                              {field.label}
                            </label>
                            <input
                              id={field.id}
                              name={field.name}
                              type={field.type}
                              placeholder={field.PlaceHolder}
                              {...register(field.id, {
                                required: field.required,
                              })}
                              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                            />
                          </div>
                        );
                      }
                    })}


                    <footer className="flex justify-end gap-2 mt-4">
                      <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                      >
                        Submit
                      </button>
                    </footer>
                  </form>
                </div>
               
              </div>

              {/* Content */}
              <div className="p-5">{children}</div>
            </DialogPanel>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition>
  );
};

export default Modal;
