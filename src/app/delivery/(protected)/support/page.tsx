import { ChatSupportPage } from "@/components/module/chat-support/chat-support-page";
import {
  PageBody,
  PageContainer,
  PageDescription,
  PageHeader,
  PageHeaderMain,
  PageTitle,
} from "@/components/shared/page-layout";

export default function DeliverySupportPage() {
  return (
    <PageContainer>
      <PageHeader>
        <PageHeaderMain>
          <PageTitle>Support</PageTitle>
          <PageDescription>
            Reach out to the operations team, track ticket status, and resolve delivery issues.
          </PageDescription>
        </PageHeaderMain>
      </PageHeader>

      <PageBody>
        <ChatSupportPage isAdminView={false} />
      </PageBody>
    </PageContainer>
  );
}
