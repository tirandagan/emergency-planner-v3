"use server";

import { revalidatePath } from 'next/cache';
import { db } from '@/db';
import { suppliers } from '@/db/schema/suppliers';
import { eq } from 'drizzle-orm';
import { checkAdmin } from '@/lib/adminAuth';

export async function getSuppliers() {
  const data = await db
    .select()
    .from(suppliers)
    .orderBy(suppliers.name);
  
  return data;
}

export async function createSupplier(formData: FormData) {
  await checkAdmin();

  const name = formData.get('name') as string;
  const websiteUrl = formData.get('website_url') as string;
  const fulfillmentType = formData.get('fulfillment_type') as string;
  
  const contactName = formData.get('contact_name') as string;
  const email = formData.get('email') as string;
  const phone = formData.get('phone') as string;
  const addressLine1 = formData.get('address_line1') as string;
  const addressLine2 = formData.get('address_line2') as string;
  const city = formData.get('city') as string;
  const state = formData.get('state') as string;
  const zipCode = formData.get('zip_code') as string;
  const country = formData.get('country') as string;
  const paymentTerms = formData.get('payment_terms') as string;
  const taxId = formData.get('tax_id') as string;
  const notes = formData.get('notes') as string;
  const joinDate = formData.get('join_date') as string || new Date().toISOString().split('T')[0];
  const logoUrl = formData.get('logo_url') as string;

  // Build contact info object
  const contactInfo: any = {};
  if (email) contactInfo.email = email;
  if (phone) contactInfo.phone = phone;
  if (addressLine1 || addressLine2 || city || state || zipCode || country) {
    contactInfo.address = [addressLine1, addressLine2, city, state, zipCode, country]
      .filter(Boolean)
      .join(', ');
  }
  if (contactName) contactInfo.contact_name = contactName;
  if (paymentTerms) contactInfo.payment_terms = paymentTerms;
  if (taxId) contactInfo.tax_id = taxId;
  if (notes) contactInfo.notes = notes;
  if (joinDate) contactInfo.join_date = joinDate;

  const [data] = await db
    .insert(suppliers)
    .values({
      name,
      websiteUrl,
      fulfillmentType,
      logoUrl,
      contactInfo,
    })
    .returning();
  
  revalidatePath('/admin/suppliers');
  return data;
}

export async function updateSupplier(formData: FormData) {
    await checkAdmin();

    const id = formData.get('id') as string;
    const name = formData.get('name') as string;
    const websiteUrl = formData.get('website_url') as string;
    const fulfillmentType = formData.get('fulfillment_type') as string;
    
    const contactName = formData.get('contact_name') as string;
    const email = formData.get('email') as string;
    const phone = formData.get('phone') as string;
    const addressLine1 = formData.get('address_line1') as string;
    const addressLine2 = formData.get('address_line2') as string;
    const city = formData.get('city') as string;
    const state = formData.get('state') as string;
    const zipCode = formData.get('zip_code') as string;
    const country = formData.get('country') as string;
    const paymentTerms = formData.get('payment_terms') as string;
    const taxId = formData.get('tax_id') as string;
    const notes = formData.get('notes') as string;
    const joinDate = formData.get('join_date') as string;
    const logoUrl = formData.get('logo_url') as string;

    // Build contact info object
    const contactInfo: any = {};
    if (email) contactInfo.email = email;
    if (phone) contactInfo.phone = phone;
    if (addressLine1 || addressLine2 || city || state || zipCode || country) {
      contactInfo.address = [addressLine1, addressLine2, city, state, zipCode, country]
        .filter(Boolean)
        .join(', ');
    }
    if (contactName) contactInfo.contact_name = contactName;
    if (paymentTerms) contactInfo.payment_terms = paymentTerms;
    if (taxId) contactInfo.tax_id = taxId;
    if (notes) contactInfo.notes = notes;
    if (joinDate) contactInfo.join_date = joinDate;

    const [data] = await db
        .update(suppliers)
        .set({
            name,
            websiteUrl,
            fulfillmentType,
            logoUrl,
            contactInfo,
        })
        .where(eq(suppliers.id, id))
        .returning();

    revalidatePath('/admin/suppliers');
    return data;
}

export async function deleteSupplier(id: string) {
    await checkAdmin();
    
    await db.delete(suppliers).where(eq(suppliers.id, id));
    
    revalidatePath('/admin/suppliers');
}
