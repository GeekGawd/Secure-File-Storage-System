import { Spinner } from "@/components/ui/spinner";

export default function Loader() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="relative w-24 h-24">
        {/* Cat body */}
        <div className="absolute w-20 h-16 bg-gray-300 rounded-full bottom-0 left-1/2 -translate-x-1/2 animate-bounce">
          {/* Cat ears */}
          <div className="absolute -top-3 left-2 w-4 h-4 bg-gray-300 rotate-45"></div>
          <div className="absolute -top-3 right-2 w-4 h-4 bg-gray-300 rotate-45"></div>
          {/* Cat face */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2">
            {/* Eyes */}
            <div className="flex gap-4">
              <div className="w-2 h-2 bg-black rounded-full"></div>
              <div className="w-2 h-2 bg-black rounded-full"></div>
            </div>
            {/* Nose */}
            <div className="w-1.5 h-1.5 bg-pink-300 rounded-full mx-auto mt-1"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
