import { Card, Col, Row } from 'react-bootstrap';

interface TeamMember {
  name: string;
  role: string;
  email: string;
  phone: string;
}

const TEAM_MEMBERS: TeamMember[] = [
  {
    name: 'Md Akif Farhan',
    role: 'Project Lead',
    email: 'akif.cse.20230104005@aust.edu',
    phone: '01861252364',
  },
  {
    name: 'Pantha Protick',
    role: 'Backend developer',
    email: 'pantha.cse.20230104010@aust.edu',
    phone: '01620879696',
  },
  {
    name: 'Raihan Hossain',
    role: 'Frontend +Backend developer',
    email: 'raihan.cse.20230104021@aust.edu',
    phone: '01634281181',
  },
  {
    name: 'Tanvir Hasan Ratul',
    role: 'Frontend developer',
    email: 'tanvir.cse.20230104021@aust.edu',
    phone: '01608776259',
  },
];

export default function Contact() {
  return (
    <section className="page-shell contact-page">
      <div className="d-flex flex-column align-items-center text-center mb-4 page-heading-row">
        <h1 className="page-heading mb-2">Contact the Team</h1>
        <p className="contact-subtitle mb-0">Reach out to any of our project members directly.</p>
      </div>

      <Row className="g-4 justify-content-center">
        {TEAM_MEMBERS.map((member) => (
          <Col key={member.email} xs={12} md={6} xl={5}>
            <Card className="themed-card contact-card h-100">
              <Card.Body>
                <Card.Title className="contact-card__name">{member.name}</Card.Title>
                <Card.Subtitle className="mb-3 contact-card__role">{member.role}</Card.Subtitle>

                <div className="contact-card__row">
                  <span className="contact-card__label">Email:</span>
                  <a className="contact-card__value" href={`mailto:${member.email}`}>
                    {member.email}
                  </a>
                </div>

                <div className="contact-card__row mt-2">
                  <span className="contact-card__label">Contact No:</span>
                  <a className="contact-card__value" href={`tel:${member.phone}`}>
                    {member.phone}
                  </a>
                </div>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>
    </section>
  );
}
