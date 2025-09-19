import { ChatSupportPage } from "@/components/module/chat-support/chat-support-page";
import {
  PageContainer,
  PageHeader,
  PageHeaderMain,
  PageTitle,
  PageDescription,
  PageBody,
} from "@/components/shared/page-layout";

export default function WorkerSupportPage() {
  return (
    <PageContainer id="worker-support">
      <PageHeader>
        <PageHeaderMain>
          <PageTitle>Support</PageTitle>
          <PageDescription>Chat with support about your production tasks and issues.</PageDescription>
        </PageHeaderMain>
      </PageHeader>

      <PageBody className="space-y-6">
        <ChatSupportPage isAdminView={false} />
      </PageBody>
    </PageContainer>
  );
}
