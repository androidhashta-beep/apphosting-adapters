import { DisplayClient } from './DisplayClient';

export default function DisplayPage() {
  return (
    <div className="p-6 bg-background h-screen w-screen overflow-hidden">
      <DisplayClient />
    </div>
  );
}
