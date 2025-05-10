// src/app/worker/(protected)/profile/page.tsx
'use client';

import { useSession } from 'next-auth/react';
import { ProfileInformationCard } from '@/components/module/inspectors/profile/profile'; // Assuming profile-card.tsx is in the same directory
import { Card, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@radix-ui/react-avatar';

export default function ProfilePage() {
  const { data: session } = useSession();

  
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">My Profile</h2>
        <p className="text-muted-foreground">
          Manage your account settings and information
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
        <Card className="md:col-span-4">
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center gap-4">
              <Avatar className="h-20 w-20">
                <AvatarImage src="/placeholder-avatar.jpg" />
                <AvatarFallback>
                  {session?.user?.name?.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="text-2xl font-bold">
                  {session?.user?.name}
                </h3>
                <p className="text-muted-foreground">
                  {/* You might fetch and display the user's role here */}
                  Worker
                </p>
              </div>
            </div>
          </CardHeader>
        </Card>
        <ProfileInformationCard />
      </div>
    </div>
  );
}

// src/app/worker/(protected)/profile/page.tsx
// 'use client';

// import { useSession } from 'next-auth/react';
// import { ProfileInformationCard } from '@/components/module/inspectors/profile/profile';
// import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
// import { Avatar, AvatarImage, AvatarFallback } from '@radix-ui/react-avatar';
// import { LoggedInInspectorQualityCheckInfo } from '@/components/module/inspectors/profile/anothercard'; // Assuming you create this component

// export default function ProfilePage() {
//   const { data: session } = useSession();

//   return (
//     <div className="space-y-6">
//       <div>
//         <h2 className="text-3xl font-bold tracking-tight">My Profile</h2>
//         <p className="text-muted-foreground">
//           Manage your account settings and information
//         </p>
//       </div>

//       <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
//         <Card className="md:col-span-4">
//           <CardHeader>
//             <div className="flex flex-col md:flex-row md:items-center gap-4">
//               <Avatar className="h-20 w-20">
//                 <AvatarImage src="/placeholder-avatar.jpg" />
//                 <AvatarFallback>
//                   {session?.user?.name?.charAt(0)}
//                 </AvatarFallback>
//               </Avatar>
//               <div>
//                 <h3 className="text-2xl font-bold">
//                   {session?.user?.name}
//                 </h3>
//                 <p className="text-muted-foreground">
//                   {/* You might fetch and display the user's role here */}
//                   Worker
//                 </p>
//               </div>
//             </div>
//           </CardHeader>
//         </Card>
//         <ProfileInformationCard />
//         {/* New Card for Quality Check Information */}
//         <Card className="md:col-span-2">
//           <LoggedInInspectorQualityCheckInfo />
//         </Card>
//         {/* You can add more cards here for other relevant information */}
//         {/* <Card className="md:col-span-2">
//           <CardHeader>
//             <CardTitle>Your Assigned Tasks</CardTitle>
//           </CardHeader>
//           <CardContent>
//             {/* Display assigned tasks here
//           </CardContent>
//         </Card> */}
//       </div>
//     </div>
//   );
// }