import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateInitialTables1700000000000 implements MigrationInterface {
    name = 'CreateInitialTables1700000000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Users 테이블 생성
        await queryRunner.query(`
            CREATE TABLE "user" (
                "id" SERIAL PRIMARY KEY,
                "email" character varying NOT NULL UNIQUE,
                "password" character varying NOT NULL,
                "name" character varying NOT NULL,
                "phone" character varying,
                "role" character varying NOT NULL DEFAULT 'user',
                "isVerified" boolean NOT NULL DEFAULT false,
                "profileImage" character varying,
                "bio" text,
                "followers" integer NOT NULL DEFAULT 0,
                "following" integer NOT NULL DEFAULT 0,
                "isActive" boolean NOT NULL DEFAULT true,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now()
            )
        `);

        // Campaigns 테이블 생성
        await queryRunner.query(`
            CREATE TABLE "campaign" (
                "id" SERIAL PRIMARY KEY,
                "title" character varying NOT NULL,
                "description" text NOT NULL,
                "creatorId" integer NOT NULL,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "fk_campaign_creator" FOREIGN KEY ("creatorId") REFERENCES "user"("id") ON DELETE CASCADE
            )
        `);

        // Auth 테이블 생성 (리프레시 토큰)
        await queryRunner.query(`
            CREATE TABLE "auth" (
                "id" SERIAL PRIMARY KEY,
                "userId" integer NOT NULL,
                "refreshToken" character varying NOT NULL,
                "expiresAt" TIMESTAMP NOT NULL,
                "isRevoked" boolean NOT NULL DEFAULT false,
                "ipAddress" character varying,
                "userAgent" character varying,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "fk_auth_user" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE
            )
        `);

        // Notifications 테이블 생성
        await queryRunner.query(`
            CREATE TABLE "notification" (
                "id" SERIAL PRIMARY KEY,
                "userId" integer NOT NULL,
                "title" character varying NOT NULL,
                "message" text NOT NULL,
                "isRead" boolean NOT NULL DEFAULT false,
                "type" character varying NOT NULL DEFAULT 'info',
                "relatedEntityType" character varying,
                "relatedEntityId" integer,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "fk_notification_user" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE
            )
        `);

        // Community Posts 테이블 생성
        await queryRunner.query(`
            CREATE TABLE "post" (
                "id" SERIAL PRIMARY KEY,
                "title" character varying NOT NULL,
                "content" text NOT NULL,
                "authorId" integer NOT NULL,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "fk_post_author" FOREIGN KEY ("authorId") REFERENCES "user"("id") ON DELETE CASCADE
            )
        `);

        // Community Comments 테이블 생성
        await queryRunner.query(`
            CREATE TABLE "comment" (
                "id" SERIAL PRIMARY KEY,
                "content" text NOT NULL,
                "authorId" integer NOT NULL,
                "postId" integer NOT NULL,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "fk_comment_author" FOREIGN KEY ("authorId") REFERENCES "user"("id") ON DELETE CASCADE,
                CONSTRAINT "fk_comment_post" FOREIGN KEY ("postId") REFERENCES "post"("id") ON DELETE CASCADE
            )
        `);

        // 인덱스 생성
        await queryRunner.query(`CREATE INDEX "IDX_user_email" ON "user" ("email")`);
        await queryRunner.query(`CREATE INDEX "IDX_campaign_creator" ON "campaign" ("creatorId")`);
        await queryRunner.query(`CREATE INDEX "IDX_auth_user" ON "auth" ("userId")`);
        await queryRunner.query(`CREATE INDEX "IDX_notification_user" ON "notification" ("userId")`);
        await queryRunner.query(`CREATE INDEX "IDX_post_author" ON "post" ("authorId")`);
        await queryRunner.query(`CREATE INDEX "IDX_comment_post" ON "comment" ("postId")`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "IDX_comment_post"`);
        await queryRunner.query(`DROP INDEX "IDX_post_author"`);
        await queryRunner.query(`DROP INDEX "IDX_notification_user"`);
        await queryRunner.query(`DROP INDEX "IDX_auth_user"`);
        await queryRunner.query(`DROP INDEX "IDX_campaign_creator"`);
        await queryRunner.query(`DROP INDEX "IDX_user_email"`);
        
        await queryRunner.query(`DROP TABLE "comment"`);
        await queryRunner.query(`DROP TABLE "post"`);
        await queryRunner.query(`DROP TABLE "notification"`);
        await queryRunner.query(`DROP TABLE "auth"`);
        await queryRunner.query(`DROP TABLE "campaign"`);
        await queryRunner.query(`DROP TABLE "user"`);
    }
} 