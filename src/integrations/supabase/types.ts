export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      ai_conversations: {
        Row: {
          channel: string
          created_at: string
          id: string
          intent: string | null
          lead_captured: boolean | null
          lead_data: Json | null
          messages: Json | null
          recommended_product_ids: string[] | null
          session_id: string
          status: string | null
          summary: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          channel?: string
          created_at?: string
          id?: string
          intent?: string | null
          lead_captured?: boolean | null
          lead_data?: Json | null
          messages?: Json | null
          recommended_product_ids?: string[] | null
          session_id: string
          status?: string | null
          summary?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          channel?: string
          created_at?: string
          id?: string
          intent?: string | null
          lead_captured?: boolean | null
          lead_data?: Json | null
          messages?: Json | null
          recommended_product_ids?: string[] | null
          session_id?: string
          status?: string | null
          summary?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      ai_lead_events: {
        Row: {
          created_at: string | null
          created_by: string | null
          event_type: string
          id: string
          lead_id: string
          payload: Json | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          event_type: string
          id?: string
          lead_id: string
          payload?: Json | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          event_type?: string
          id?: string
          lead_id?: string
          payload?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_lead_events_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "ai_leads"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_leads: {
        Row: {
          assigned_to: string | null
          budget: string | null
          conversation_id: string | null
          created_at: string | null
          email: string | null
          id: string
          internal_notes: string | null
          lead_type: string
          metadata: Json | null
          name: string | null
          next_action_at: string | null
          notes: string | null
          phone: string | null
          preferred_contact: string | null
          source_channel: string
          status: string
          tire_size: string | null
          updated_at: string | null
          vehicle_make: string | null
          vehicle_model: string | null
          vehicle_year: string | null
        }
        Insert: {
          assigned_to?: string | null
          budget?: string | null
          conversation_id?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          internal_notes?: string | null
          lead_type?: string
          metadata?: Json | null
          name?: string | null
          next_action_at?: string | null
          notes?: string | null
          phone?: string | null
          preferred_contact?: string | null
          source_channel?: string
          status?: string
          tire_size?: string | null
          updated_at?: string | null
          vehicle_make?: string | null
          vehicle_model?: string | null
          vehicle_year?: string | null
        }
        Update: {
          assigned_to?: string | null
          budget?: string | null
          conversation_id?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          internal_notes?: string | null
          lead_type?: string
          metadata?: Json | null
          name?: string | null
          next_action_at?: string | null
          notes?: string | null
          phone?: string | null
          preferred_contact?: string | null
          source_channel?: string
          status?: string
          tire_size?: string | null
          updated_at?: string | null
          vehicle_make?: string | null
          vehicle_model?: string | null
          vehicle_year?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_leads_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "ai_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_log: {
        Row: {
          action: string
          created_at: string
          id: string
          ip_address: string | null
          new_values: Json | null
          old_values: Json | null
          record_id: string | null
          table_name: string
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          ip_address?: string | null
          new_values?: Json | null
          old_values?: Json | null
          record_id?: string | null
          table_name: string
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          ip_address?: string | null
          new_values?: Json | null
          old_values?: Json | null
          record_id?: string | null
          table_name?: string
          user_id?: string | null
        }
        Relationships: []
      }
      carts: {
        Row: {
          created_at: string
          fulfillment_method:
            | Database["public"]["Enums"]["fulfillment_method"]
            | null
          guest_id: string | null
          id: string
          items: Json | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          fulfillment_method?:
            | Database["public"]["Enums"]["fulfillment_method"]
            | null
          guest_id?: string | null
          id?: string
          items?: Json | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          fulfillment_method?:
            | Database["public"]["Enums"]["fulfillment_method"]
            | null
          guest_id?: string | null
          id?: string
          items?: Json | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      checkout_addons: {
        Row: {
          category: string | null
          created_at: string
          description: string | null
          id: string
          is_active: boolean | null
          is_taxable: boolean | null
          name: string
          price: number
          sort_order: number | null
          updated_at: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_taxable?: boolean | null
          name: string
          price?: number
          sort_order?: number | null
          updated_at?: string
        }
        Update: {
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_taxable?: boolean | null
          name?: string
          price?: number
          sort_order?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      claimed_orders: {
        Row: {
          claimed_at: string | null
          id: string
          order_id: string
          user_id: string
          verification_method: string
        }
        Insert: {
          claimed_at?: string | null
          id?: string
          order_id: string
          user_id: string
          verification_method: string
        }
        Update: {
          claimed_at?: string | null
          id?: string
          order_id?: string
          user_id?: string
          verification_method?: string
        }
        Relationships: [
          {
            foreignKeyName: "claimed_orders_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      company_info: {
        Row: {
          category: string
          created_at: string
          id: string
          key: string
          updated_at: string
          value: string
        }
        Insert: {
          category: string
          created_at?: string
          id?: string
          key: string
          updated_at?: string
          value: string
        }
        Update: {
          category?: string
          created_at?: string
          id?: string
          key?: string
          updated_at?: string
          value?: string
        }
        Relationships: []
      }
      customers: {
        Row: {
          address: string | null
          city: string | null
          created_at: string
          email: string
          guest_id: string | null
          id: string
          name: string
          notes: string | null
          phone: string
          postal_code: string | null
          preferred_contact: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          created_at?: string
          email: string
          guest_id?: string | null
          id?: string
          name: string
          notes?: string | null
          phone: string
          postal_code?: string | null
          preferred_contact?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          created_at?: string
          email?: string
          guest_id?: string | null
          id?: string
          name?: string
          notes?: string | null
          phone?: string
          postal_code?: string | null
          preferred_contact?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      dealer_quotes: {
        Row: {
          admin_notes: string | null
          created_at: string
          dealer_id: string
          id: string
          items: Json
          notes: string | null
          quoted_total: number | null
          status: string | null
          updated_at: string
          valid_until: string | null
        }
        Insert: {
          admin_notes?: string | null
          created_at?: string
          dealer_id: string
          id?: string
          items?: Json
          notes?: string | null
          quoted_total?: number | null
          status?: string | null
          updated_at?: string
          valid_until?: string | null
        }
        Update: {
          admin_notes?: string | null
          created_at?: string
          dealer_id?: string
          id?: string
          items?: Json
          notes?: string | null
          quoted_total?: number | null
          status?: string | null
          updated_at?: string
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "dealer_quotes_dealer_id_fkey"
            columns: ["dealer_id"]
            isOneToOne: false
            referencedRelation: "dealers"
            referencedColumns: ["id"]
          },
        ]
      }
      dealers: {
        Row: {
          address: string | null
          approved_at: string | null
          business_name: string
          business_type: string | null
          city: string | null
          contact_name: string
          created_at: string
          document_url: string | null
          email: string
          id: string
          notes: string | null
          phone: string
          postal_code: string | null
          province: string | null
          status: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          address?: string | null
          approved_at?: string | null
          business_name: string
          business_type?: string | null
          city?: string | null
          contact_name: string
          created_at?: string
          document_url?: string | null
          email: string
          id?: string
          notes?: string | null
          phone: string
          postal_code?: string | null
          province?: string | null
          status?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          address?: string | null
          approved_at?: string | null
          business_name?: string
          business_type?: string | null
          city?: string | null
          contact_name?: string
          created_at?: string
          document_url?: string | null
          email?: string
          id?: string
          notes?: string | null
          phone?: string
          postal_code?: string | null
          province?: string | null
          status?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      faq_entries: {
        Row: {
          answer: string
          created_at: string | null
          id: string
          is_active: boolean | null
          question: string
          sort_order: number | null
          tags: string[] | null
          updated_at: string | null
        }
        Insert: {
          answer: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          question: string
          sort_order?: number | null
          tags?: string[] | null
          updated_at?: string | null
        }
        Update: {
          answer?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          question?: string
          sort_order?: number | null
          tags?: string[] | null
          updated_at?: string | null
        }
        Relationships: []
      }
      fleet_inquiries: {
        Row: {
          company_name: string
          contact_name: string
          created_at: string
          current_supplier: string | null
          email: string
          fleet_size: string
          id: string
          notes: string | null
          phone: string
          status: string | null
          updated_at: string
          vehicle_types: string[] | null
        }
        Insert: {
          company_name: string
          contact_name: string
          created_at?: string
          current_supplier?: string | null
          email: string
          fleet_size: string
          id?: string
          notes?: string | null
          phone: string
          status?: string | null
          updated_at?: string
          vehicle_types?: string[] | null
        }
        Update: {
          company_name?: string
          contact_name?: string
          created_at?: string
          current_supplier?: string | null
          email?: string
          fleet_size?: string
          id?: string
          notes?: string | null
          phone?: string
          status?: string | null
          updated_at?: string
          vehicle_types?: string[] | null
        }
        Relationships: []
      }
      inventory: {
        Row: {
          id: string
          product_id: string
          qty_on_hand: number
          qty_reserved: number
          reorder_level: number | null
          updated_at: string
        }
        Insert: {
          id?: string
          product_id: string
          qty_on_hand?: number
          qty_reserved?: number
          reorder_level?: number | null
          updated_at?: string
        }
        Update: {
          id?: string
          product_id?: string
          qty_on_hand?: number
          qty_reserved?: number
          reorder_level?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: true
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_movements: {
        Row: {
          created_at: string
          created_by: string | null
          delta_qty: number
          id: string
          notes: string | null
          product_id: string
          reason: string
          reference_id: string | null
          reference_type: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          delta_qty: number
          id?: string
          notes?: string | null
          product_id: string
          reason: string
          reference_id?: string | null
          reference_type?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          delta_qty?: number
          id?: string
          notes?: string | null
          product_id?: string
          reason?: string
          reference_id?: string | null
          reference_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inventory_movements_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          created_at: string
          created_by: string | null
          customer_id: string | null
          dealer_id: string | null
          due_date: string | null
          gst: number
          id: string
          invoice_number: string
          line_items: Json
          notes: string | null
          order_id: string | null
          paid_at: string | null
          pdf_url: string | null
          status: string | null
          subtotal: number
          total: number
          type: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          customer_id?: string | null
          dealer_id?: string | null
          due_date?: string | null
          gst?: number
          id?: string
          invoice_number: string
          line_items?: Json
          notes?: string | null
          order_id?: string | null
          paid_at?: string | null
          pdf_url?: string | null
          status?: string | null
          subtotal: number
          total: number
          type?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          customer_id?: string | null
          dealer_id?: string | null
          due_date?: string | null
          gst?: number
          id?: string
          invoice_number?: string
          line_items?: Json
          notes?: string | null
          order_id?: string | null
          paid_at?: string | null
          pdf_url?: string | null
          status?: string | null
          subtotal?: number
          total?: number
          type?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoices_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_dealer_id_fkey"
            columns: ["dealer_id"]
            isOneToOne: false
            referencedRelation: "dealers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      mobile_swap_bookings: {
        Row: {
          address: string
          city: string | null
          contact_log: Json | null
          created_at: string
          email: string
          id: string
          internal_notes: string | null
          name: string
          notes: string | null
          num_tires: number | null
          phone: string
          photo_urls: string[] | null
          postal_code: string | null
          preferred_date: string
          preferred_time_window: string | null
          quoted_price: number | null
          service_type: string | null
          status: string | null
          tire_size: string | null
          updated_at: string
          user_id: string | null
          vehicle_make: string | null
          vehicle_model: string | null
          vehicle_year: string | null
        }
        Insert: {
          address: string
          city?: string | null
          contact_log?: Json | null
          created_at?: string
          email: string
          id?: string
          internal_notes?: string | null
          name: string
          notes?: string | null
          num_tires?: number | null
          phone: string
          photo_urls?: string[] | null
          postal_code?: string | null
          preferred_date: string
          preferred_time_window?: string | null
          quoted_price?: number | null
          service_type?: string | null
          status?: string | null
          tire_size?: string | null
          updated_at?: string
          user_id?: string | null
          vehicle_make?: string | null
          vehicle_model?: string | null
          vehicle_year?: string | null
        }
        Update: {
          address?: string
          city?: string | null
          contact_log?: Json | null
          created_at?: string
          email?: string
          id?: string
          internal_notes?: string | null
          name?: string
          notes?: string | null
          num_tires?: number | null
          phone?: string
          photo_urls?: string[] | null
          postal_code?: string | null
          preferred_date?: string
          preferred_time_window?: string | null
          quoted_price?: number | null
          service_type?: string | null
          status?: string | null
          tire_size?: string | null
          updated_at?: string
          user_id?: string | null
          vehicle_make?: string | null
          vehicle_model?: string | null
          vehicle_year?: string | null
        }
        Relationships: []
      }
      newsletter_subscribers: {
        Row: {
          created_at: string
          email: string
          id: string
          is_active: boolean | null
          name: string | null
          preferences: Json | null
          source: string | null
          unsubscribed_at: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          is_active?: boolean | null
          name?: string | null
          preferences?: Json | null
          source?: string | null
          unsubscribed_at?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          is_active?: boolean | null
          name?: string | null
          preferences?: Json | null
          source?: string | null
          unsubscribed_at?: string | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string | null
          error: string | null
          id: string
          payload: Json | null
          sent_at: string | null
          status: string
          subject: string
          to_email: string
          type: string
        }
        Insert: {
          created_at?: string | null
          error?: string | null
          id?: string
          payload?: Json | null
          sent_at?: string | null
          status?: string
          subject: string
          to_email: string
          type: string
        }
        Update: {
          created_at?: string | null
          error?: string | null
          id?: string
          payload?: Json | null
          sent_at?: string | null
          status?: string
          subject?: string
          to_email?: string
          type?: string
        }
        Relationships: []
      }
      order_addons: {
        Row: {
          addon_id: string | null
          created_at: string
          id: string
          is_taxable: boolean | null
          name: string
          order_id: string
          price: number
          quantity: number
        }
        Insert: {
          addon_id?: string | null
          created_at?: string
          id?: string
          is_taxable?: boolean | null
          name: string
          order_id: string
          price: number
          quantity?: number
        }
        Update: {
          addon_id?: string | null
          created_at?: string
          id?: string
          is_taxable?: boolean | null
          name?: string
          order_id?: string
          price?: number
          quantity?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_addons_addon_id_fkey"
            columns: ["addon_id"]
            isOneToOne: false
            referencedRelation: "checkout_addons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_addons_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          created_at: string
          description: string | null
          id: string
          order_id: string
          product_id: string | null
          quantity: number
          size: string
          total_price: number
          unit_price: number
          vendor: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          order_id: string
          product_id?: string | null
          quantity: number
          size: string
          total_price: number
          unit_price: number
          vendor?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          order_id?: string
          product_id?: string | null
          quantity?: number
          size?: string
          total_price?: number
          unit_price?: number
          vendor?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          created_at: string
          customer_id: string | null
          fulfillment_method: Database["public"]["Enums"]["fulfillment_method"]
          gst: number
          guest_id: string | null
          id: string
          needs_stock_confirmation: boolean | null
          notes: string | null
          order_number: string
          payment_method: string | null
          status: Database["public"]["Enums"]["order_status"] | null
          subtotal: number
          total: number
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          customer_id?: string | null
          fulfillment_method: Database["public"]["Enums"]["fulfillment_method"]
          gst: number
          guest_id?: string | null
          id?: string
          needs_stock_confirmation?: boolean | null
          notes?: string | null
          order_number: string
          payment_method?: string | null
          status?: Database["public"]["Enums"]["order_status"] | null
          subtotal: number
          total: number
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          customer_id?: string | null
          fulfillment_method?: Database["public"]["Enums"]["fulfillment_method"]
          gst?: number
          guest_id?: string | null
          id?: string
          needs_stock_confirmation?: boolean | null
          notes?: string | null
          order_number?: string
          payment_method?: string | null
          status?: Database["public"]["Enums"]["order_status"] | null
          subtotal?: number
          total?: number
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      page_sections: {
        Row: {
          content_json: Json
          created_at: string
          id: string
          is_active: boolean | null
          page_id: string
          section_key: string
          section_type: string
          sort_order: number | null
          updated_at: string
        }
        Insert: {
          content_json?: Json
          created_at?: string
          id?: string
          is_active?: boolean | null
          page_id: string
          section_key: string
          section_type?: string
          sort_order?: number | null
          updated_at?: string
        }
        Update: {
          content_json?: Json
          created_at?: string
          id?: string
          is_active?: boolean | null
          page_id?: string
          section_key?: string
          section_type?: string
          sort_order?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "page_sections_page_id_fkey"
            columns: ["page_id"]
            isOneToOne: false
            referencedRelation: "pages"
            referencedColumns: ["id"]
          },
        ]
      }
      pages: {
        Row: {
          canonical_url: string | null
          created_at: string
          id: string
          is_active: boolean | null
          noindex: boolean | null
          og_image: string | null
          seo_description: string | null
          seo_title: string | null
          slug: string
          title: string
          updated_at: string
        }
        Insert: {
          canonical_url?: string | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          noindex?: boolean | null
          og_image?: string | null
          seo_description?: string | null
          seo_title?: string | null
          slug: string
          title: string
          updated_at?: string
        }
        Update: {
          canonical_url?: string | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          noindex?: boolean | null
          og_image?: string | null
          seo_description?: string | null
          seo_title?: string | null
          slug?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      policies: {
        Row: {
          category: string | null
          content: string
          id: string
          is_active: boolean | null
          key: string
          title: string
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          category?: string | null
          content: string
          id?: string
          is_active?: boolean | null
          key: string
          title: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          category?: string | null
          content?: string
          id?: string
          is_active?: boolean | null
          key?: string
          title?: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: []
      }
      product_categories: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          parent_id: string | null
          slug: string
          sort_order: number | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          parent_id?: string | null
          slug: string
          sort_order?: number | null
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          parent_id?: string | null
          slug?: string
          sort_order?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "product_categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "product_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          availability: string | null
          category_id: string | null
          created_at: string
          description: string | null
          features: string[] | null
          id: string
          image_url: string | null
          is_active: boolean | null
          low_stock_threshold: number | null
          price: number
          quantity: number | null
          size: string
          sku: string | null
          type: Database["public"]["Enums"]["tire_type"]
          updated_at: string
          vendor: string | null
          wholesale_price: number | null
        }
        Insert: {
          availability?: string | null
          category_id?: string | null
          created_at?: string
          description?: string | null
          features?: string[] | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          low_stock_threshold?: number | null
          price: number
          quantity?: number | null
          size: string
          sku?: string | null
          type?: Database["public"]["Enums"]["tire_type"]
          updated_at?: string
          vendor?: string | null
          wholesale_price?: number | null
        }
        Update: {
          availability?: string | null
          category_id?: string | null
          created_at?: string
          description?: string | null
          features?: string[] | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          low_stock_threshold?: number | null
          price?: number
          quantity?: number | null
          size?: string
          sku?: string | null
          type?: Database["public"]["Enums"]["tire_type"]
          updated_at?: string
          vendor?: string | null
          wholesale_price?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "product_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      review_requests: {
        Row: {
          clicked_at: string | null
          created_at: string
          customer_id: string | null
          email: string
          id: string
          order_id: string | null
          phone: string | null
          review_url: string | null
          scheduled_for: string | null
          sent_at: string | null
          status: string | null
        }
        Insert: {
          clicked_at?: string | null
          created_at?: string
          customer_id?: string | null
          email: string
          id?: string
          order_id?: string | null
          phone?: string | null
          review_url?: string | null
          scheduled_for?: string | null
          sent_at?: string | null
          status?: string | null
        }
        Update: {
          clicked_at?: string | null
          created_at?: string
          customer_id?: string | null
          email?: string
          id?: string
          order_id?: string | null
          phone?: string | null
          review_url?: string | null
          scheduled_for?: string | null
          sent_at?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "review_requests_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "review_requests_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      service_bookings: {
        Row: {
          created_at: string
          email: string
          id: string
          name: string
          notes: string | null
          phone: string
          preferred_date: string | null
          preferred_time: string | null
          service_type: string
          status: string | null
          updated_at: string
          user_id: string | null
          vehicle_info: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          name: string
          notes?: string | null
          phone: string
          preferred_date?: string | null
          preferred_time?: string | null
          service_type: string
          status?: string | null
          updated_at?: string
          user_id?: string | null
          vehicle_info?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          name?: string
          notes?: string | null
          phone?: string
          preferred_date?: string | null
          preferred_time?: string | null
          service_type?: string
          status?: string | null
          updated_at?: string
          user_id?: string | null
          vehicle_info?: string | null
        }
        Relationships: []
      }
      service_catalog: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          price_note: string | null
          sort_order: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          price_note?: string | null
          sort_order?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          price_note?: string | null
          sort_order?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      site_settings: {
        Row: {
          description: string | null
          id: string
          key: string
          updated_at: string
          updated_by: string | null
          value: Json
        }
        Insert: {
          description?: string | null
          id?: string
          key: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Update: {
          description?: string | null
          id?: string
          key?: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Relationships: []
      }
      subscription_plans: {
        Row: {
          created_at: string
          description: string | null
          features: Json | null
          for_fleet: boolean | null
          id: string
          is_active: boolean | null
          max_vehicles: number | null
          name: string
          price_annually: number | null
          price_monthly: number | null
          tier: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          features?: Json | null
          for_fleet?: boolean | null
          id?: string
          is_active?: boolean | null
          max_vehicles?: number | null
          name: string
          price_annually?: number | null
          price_monthly?: number | null
          tier: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          features?: Json | null
          for_fleet?: boolean | null
          id?: string
          is_active?: boolean | null
          max_vehicles?: number | null
          name?: string
          price_annually?: number | null
          price_monthly?: number | null
          tier?: string
          updated_at?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          billing_interval: string | null
          company_name: string | null
          contact_email: string
          contact_name: string
          contact_phone: string
          created_at: string
          id: string
          next_renewal_date: string | null
          notes: string | null
          plan_id: string
          service_preferences: Json | null
          start_date: string | null
          status: string | null
          updated_at: string
          user_id: string | null
          vehicles: Json | null
        }
        Insert: {
          billing_interval?: string | null
          company_name?: string | null
          contact_email: string
          contact_name: string
          contact_phone: string
          created_at?: string
          id?: string
          next_renewal_date?: string | null
          notes?: string | null
          plan_id: string
          service_preferences?: Json | null
          start_date?: string | null
          status?: string | null
          updated_at?: string
          user_id?: string | null
          vehicles?: Json | null
        }
        Update: {
          billing_interval?: string | null
          company_name?: string | null
          contact_email?: string
          contact_name?: string
          contact_phone?: string
          created_at?: string
          id?: string
          next_renewal_date?: string | null
          notes?: string | null
          plan_id?: string
          service_preferences?: Json | null
          start_date?: string | null
          status?: string | null
          updated_at?: string
          user_id?: string | null
          vehicles?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "subscription_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_products_admin: {
        Args: never
        Returns: {
          availability: string
          category_id: string
          created_at: string
          description: string
          features: string[]
          id: string
          image_url: string
          is_active: boolean
          low_stock_threshold: number
          price: number
          quantity: number
          size: string
          sku: string
          type: Database["public"]["Enums"]["tire_type"]
          updated_at: string
          vendor: string
          wholesale_price: number
        }[]
      }
      get_products_public: {
        Args: { p_product_id?: string }
        Returns: {
          availability: string
          category_id: string
          created_at: string
          description: string
          features: string[]
          id: string
          image_url: string
          is_active: boolean
          low_stock_threshold: number
          price: number
          quantity: number
          size: string
          sku: string
          type: Database["public"]["Enums"]["tire_type"]
          updated_at: string
          vendor: string
          wholesale_price: number
        }[]
      }
      get_products_view: {
        Args: never
        Returns: {
          availability: string
          category_id: string
          created_at: string
          description: string
          features: string[]
          id: string
          image_url: string
          is_active: boolean
          low_stock_threshold: number
          price: number
          quantity: number
          size: string
          sku: string
          type: Database["public"]["Enums"]["tire_type"]
          updated_at: string
          vendor: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin_or_staff: { Args: { _user_id: string }; Returns: boolean }
      is_approved_dealer: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "dealer" | "user" | "staff"
      fulfillment_method: "pickup" | "installation" | "delivery" | "shipping"
      order_status:
        | "pending"
        | "confirmed"
        | "ready"
        | "completed"
        | "cancelled"
      tire_type: "all_season" | "winter" | "summer" | "all_weather"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "dealer", "user", "staff"],
      fulfillment_method: ["pickup", "installation", "delivery", "shipping"],
      order_status: ["pending", "confirmed", "ready", "completed", "cancelled"],
      tire_type: ["all_season", "winter", "summer", "all_weather"],
    },
  },
} as const
