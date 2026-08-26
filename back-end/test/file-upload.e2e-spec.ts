import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import * as fs from 'fs';
import * as path from 'path';
import { AppModule } from '../src/app.module';

describe('File Upload Middleware (POST /course-slots/:id/syllabus)', () => {
  let app: INestApplication;
  const createdFiles: string[] = [];

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();
  });

  afterAll(async () => {
    // Clean up files uploaded during testing
    for (const filePath of createdFiles) {
      if (fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath);
        } catch {
          // ignore cleanup errors
        }
      }
    }
    await app.close();
  });

  // Test 1: Valid supported file upload
  it('Test 1: should successfully upload a valid supported file (PDF) to /course-slots/:id/syllabus', async () => {
    const fileContent = Buffer.from('%PDF-1.4 sample syllabus content');
    const response = await request(app.getHttpServer())
      .post('/course-slots/1/syllabus')
      .set('x-role', 'Faculty')
      .attach('file', fileContent, {
        filename: 'course_syllabus.pdf',
        contentType: 'application/pdf',
      })
      .expect(201);

    expect(response.body).toBeDefined();
    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe('Syllabus uploaded successfully');
    expect(response.body.slotId).toBe(1);
    expect(response.body.file).toBeDefined();
    expect(response.body.file.originalName).toBe('course_syllabus.pdf');
    expect(response.body.file.mimetype).toBe('application/pdf');
    expect(response.body.file.filename).toMatch(/course_syllabus-\d+-\d+\.pdf/);
    expect(response.body.file.path).toMatch(/^uploads[\\\/]/);
    expect(response.body.slot.syllabus).toBe(response.body.file.path);

    const physicalPath = path.resolve(process.cwd(), response.body.file.path);
    createdFiles.push(physicalPath);
  });

  // Test 2: Unsupported file type rejection
  it('Test 2: should reject an unsupported file type (.exe / application/x-msdownload) with 400', async () => {
    const fileContent = Buffer.from('MZ executable binary header');
    const response = await request(app.getHttpServer())
      .post('/course-slots/1/syllabus')
      .set('x-role', 'Faculty')
      .attach('file', fileContent, {
        filename: 'malicious.exe',
        contentType: 'application/x-msdownload',
      })
      .expect(400);

    expect(response.body.message).toMatch(/Unsupported file type/);
  });

  // Test 3: File exceeding maximum configured size limit (> 5MB)
  it('Test 3: should reject a file exceeding the 5MB size limit', async () => {
    const largeBuffer = Buffer.alloc(5.5 * 1024 * 1024); // 5.5 MB
    const response = await request(app.getHttpServer())
      .post('/course-slots/1/syllabus')
      .set('x-role', 'Faculty')
      .attach('file', largeBuffer, {
        filename: 'large_syllabus.pdf',
        contentType: 'application/pdf',
      });

    // Multer size limit returns 400 or 413
    expect([400, 413]).toContain(response.status);
  });

  // Test 4: Request without a file
  it('Test 4: should reject a request when no file is provided with 400', async () => {
    const response = await request(app.getHttpServer())
      .post('/course-slots/1/syllabus')
      .set('x-role', 'Faculty')
      .send({})
      .expect(400);

    expect(response.body.message).toMatch(/No file provided/);
  });

  // Test 5: Verify physical file exists in back-end/uploads/
  it('Test 5: should verify the physical file exists on disk inside back-end/uploads/', async () => {
    const testData = 'Sample syllabus text content for verification test 5';
    const fileContent = Buffer.from(testData);

    const response = await request(app.getHttpServer())
      .post('/course-slots/2/syllabus')
      .set('x-role', 'Dean')
      .attach('file', fileContent, {
        filename: 'test5_syllabus.txt',
        contentType: 'text/plain',
      })
      .expect(201);

    const relativePath = response.body.file.path;
    const absolutePath = path.resolve(process.cwd(), relativePath);
    createdFiles.push(absolutePath);

    expect(fs.existsSync(absolutePath)).toBe(true);
    const diskContent = fs.readFileSync(absolutePath, 'utf8');
    expect(diskContent).toBe(testData);
    expect(response.body.file.size).toBe(Buffer.byteLength(testData));
  });

  // Additional check: Slot not found
  it('should return 404 if course slot does not exist', async () => {
    const fileContent = Buffer.from('Syllabus content');
    const response = await request(app.getHttpServer())
      .post('/course-slots/9999/syllabus')
      .set('x-role', 'Faculty')
      .attach('file', fileContent, {
        filename: 'syllabus.pdf',
        contentType: 'application/pdf',
      })
      .expect(404);

    expect(response.body.message).toMatch(/Course Slot 9999 not found/);
  });
});
