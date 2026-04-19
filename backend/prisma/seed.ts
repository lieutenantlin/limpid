import { PrismaClient, UserRole, DeviceStatus, SampleSource } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const adminHash = await bcrypt.hash('admin1234', 12);
  const researcherHash = await bcrypt.hash('researcher1234', 12);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      passwordHash: adminHash,
      name: 'Admin User',
      role: UserRole.admin,
    },
  });

  const researcher = await prisma.user.upsert({
    where: { email: 'researcher@example.com' },
    update: {},
    create: {
      email: 'researcher@example.com',
      passwordHash: researcherHash,
      name: 'Jane Researcher',
      role: UserRole.researcher,
    },
  });

  const device1 = await prisma.device.upsert({
    where: { deviceId: 'unoq-001' },
    update: {},
    create: {
      deviceId: 'unoq-001',
      label: 'Harbor Edge Device',
      status: DeviceStatus.active,
      firmwareVersion: '1.0.0',
      modelVersion: 'v1.3.0',
      lastSeenAt: new Date(),
    },
  });

  const device2 = await prisma.device.upsert({
    where: { deviceId: 'unoq-002' },
    update: {},
    create: {
      deviceId: 'unoq-002',
      label: 'Bay Research Station',
      status: DeviceStatus.active,
      firmwareVersion: '1.0.0',
      modelVersion: 'v1.3.0',
      lastSeenAt: new Date(),
    },
  });

  const sampleData = [
    { lat: 33.40, lng: -118.00, estimate: 12.4, confidence: 0.87 },
    { lat: 33.45, lng: -117.90, estimate: 8.1,  confidence: 0.91 },
    { lat: 33.38, lng: -118.05, estimate: 15.6, confidence: 0.78 },
    { lat: 33.42, lng: -117.95, estimate: 5.3,  confidence: 0.94 },
    { lat: 33.35, lng: -118.10, estimate: 22.1, confidence: 0.82 },
    { lat: 33.50, lng: -117.85, estimate: 18.7, confidence: 0.89 },
    { lat: 33.48, lng: -117.92, estimate: 9.4,  confidence: 0.92 },
    { lat: 33.44, lng: -118.02, estimate: 11.2, confidence: 0.85 },
    { lat: 33.37, lng: -118.08, estimate: 14.8, confidence: 0.79 },
    { lat: 33.52, lng: -117.88, estimate: 7.6,  confidence: 0.94 },
    { lat: 33.46, lng: -117.98, estimate: 19.3, confidence: 0.81 },
    { lat: 33.41, lng: -118.06, estimate: 10.5, confidence: 0.88 },
    { lat: 33.39, lng: -118.03, estimate: 13.7, confidence: 0.86 },
    { lat: 33.49, lng: -117.91, estimate: 16.2, confidence: 0.83 },
    { lat: 33.43, lng: -117.99, estimate: 8.9,  confidence: 0.90 },
  ];

  for (let i = 0; i < sampleData.length; i++) {
    const d = sampleData[i];
    await prisma.sample.upsert({
      where: { sampleId: `seed-sample-${i + 1}` },
      update: {},
      create: {
        sampleId: `seed-sample-${i + 1}`,
        deviceId: i % 2 === 0 ? device1.id : device2.id,
        capturedAt: new Date(Date.now() - i * 3600 * 1000),
        latitude: d.lat,
        longitude: d.lng,
        microplasticEstimate: d.estimate,
        unit: 'particles_per_ml',
        confidence: d.confidence,
        modelVersion: 'v1.3.0',
        qualityScore: 0.8,
        source: SampleSource.edge,
        createdByUserId: researcher.id,
      },
    });
  }

  console.log('Seed complete');
  console.log('Admin:      admin@example.com / admin1234');
  console.log('Researcher: researcher@example.com / researcher1234');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
