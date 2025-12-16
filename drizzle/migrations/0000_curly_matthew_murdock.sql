CREATE TABLE "profiles" (
	"id" uuid PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"full_name" text,
	"first_name" text,
	"last_name" text,
	"birth_year" integer,
	"role" text DEFAULT 'USER' NOT NULL,
	"subscription_tier" text DEFAULT 'FREE' NOT NULL,
	"subscription_status" text,
	"stripe_customer_id" text,
	"stripe_subscription_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "profiles_email_unique" UNIQUE("email")
);
