import { CalendarDays, CheckCircle2, Plus, Sparkles } from "lucide-react"

import AppPage from "../components/ui/AppPage"
import Avatar from "../components/ui/Avatar"
import Button from "../components/ui/Button"
import EmptyState from "../components/ui/EmptyState"
import ListRow from "../components/ui/ListRow"
import Metric from "../components/ui/Metric"
import PageHeader from "../components/ui/PageHeader"
import SectionCard from "../components/ui/SectionCard"
import StatusBadge from "../components/ui/StatusBadge"
import TextField from "../components/ui/TextField"
import TextAreaField from "../components/ui/TextAreaField"
import SelectField from "../components/ui/SelectField"
import FormSection from "../components/ui/FormSection"
import TimelineRow from "../components/ui/TimelineRow"
import DateBadge from "../components/ui/DateBadge"

export default function UIKit() {
    return (
        <AppPage>
            <PageHeader
                eyebrow="Internal"
                title="Evergrove UI Kit"
                subtitle="Reusable components for the Evergrove design system."
            />

            <div className="eg-stack">
                <SectionCard title="Buttons">
                    <div className="eg-ui-row">
                        <Button>Primary</Button>
                        <Button variant="secondary">Secondary</Button>
                        <Button variant="danger">Danger</Button>
                        <Button variant="ghost">Ghost</Button>
                    </div>
                </SectionCard>

                <SectionCard title="Avatars">
                    <div className="eg-ui-row">
                        <Avatar name="Matt McGee" size="sm" />
                        <Avatar name="Laura McGee" size="md" />
                        <Avatar name="Case McGee" size="lg" />
                    </div>
                </SectionCard>

                <SectionCard title="Badges">
                    <div className="eg-ui-row">
                        <StatusBadge>Neutral</StatusBadge>
                        <StatusBadge tone="primary">Primary</StatusBadge>
                        <StatusBadge tone="success">Success</StatusBadge>
                        <StatusBadge tone="warning">Warning</StatusBadge>
                        <StatusBadge tone="danger">Danger</StatusBadge>
                    </div>
                </SectionCard>

                <SectionCard title="Metrics">
                    <div className="eg-ui-grid">
                        <Metric value="4" label="Open" />
                        <Metric value="2" label="Today" />
                    </div>
                </SectionCard>

                <SectionCard title="List Rows">
                    <ListRow
                        icon={<CalendarDays size={20} />}
                        title="Vacation Bible School"
                        subtitle="Today"
                        meta="9:00 AM"
                        onClick={() => { }}
                    />

                    <ListRow
                        icon={<CheckCircle2 size={20} />}
                        title="Pick up groceries"
                        subtitle="Assigned to Matt"
                        meta="Due today"
                    />
                </SectionCard>

                <SectionCard title="Assistant Card">
                    <div className="eg-ui-assistant-demo">
                        <Sparkles size={22} />

                        <div>
                            <strong>Independence Day is coming up</strong>
                            <p>Evergrove can help you plan ahead.</p>
                        </div>
                    </div>

                    <Button variant="secondary" size="sm">
                        <Plus size={16} />
                        Create tasks
                    </Button>
                </SectionCard>

                <SectionCard title="Empty State">
                    <EmptyState
                        title="Nothing due today"
                        message="Enjoy the calm. Evergrove will surface anything that needs attention."
                    />
                </SectionCard>

                <SectionCard title="Forms">
                    <FormSection title="New To-Do">
                        <TextField
                            label="Title"
                            value="Pick up groceries"
                            onChange={() => { }}
                            placeholder="What needs to get done?"
                        />

                        <TextField
                            label="Due Date"
                            type="date"
                            value=""
                            onChange={() => { }}
                        />

                        <SelectField
                            label="Assign To"
                            value=""
                            onChange={() => { }}
                            options={[
                                { value: "", label: "No one selected" },
                                { value: "matt", label: "Matt" },
                                { value: "laura", label: "Laura" },
                            ]}
                        />

                        <TextAreaField
                            label="Notes"
                            value=""
                            onChange={() => { }}
                            placeholder="Add helpful details..."
                        />

                        <Button size="lg">
                            Save To-Do
                        </Button>
                    </FormSection>
                </SectionCard>

                <SectionCard title="Timeline Rows">
                    <TimelineRow
                        icon="🎒"
                        title="Picture Day"
                        subtitle="Ella"
                        meta="Today"
                        detail="School"
                        onClick={() => { }}
                    />

                    <TimelineRow
                        icon="🍽️"
                        title="Grilled Steak"
                        subtitle="Dinner tonight"
                        meta="6:00 PM"
                    />

                    <TimelineRow
                        icon="🚗"
                        title="Family Trip"
                        subtitle="Dallas"
                        meta="Fri"
                        detail="Trip"
                    />
                </SectionCard>

                <SectionCard title="Date Badges">
                    <div className="eg-ui-row">
                        <DateBadge date="2026-06-27" label="Today" />
                        <DateBadge date="2026-06-28" label="Tomorrow" />
                        <DateBadge date="2026-07-04" />
                    </div>
                </SectionCard>

            </div>
        </AppPage>
    )
}