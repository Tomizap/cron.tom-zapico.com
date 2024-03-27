const axios = require('axios')

FILE_PATH = "C:\\Users\\zapto\\Desktop\\fiducar\\fiducar.xml"

let a = async function run () {
  while (true) {
      try {
        axios.get('https://sw.ubiflow.net/diffusion-annonces.php?MDP_PARTENAIRE=a4d04dd3423c4ad61816f3d04005f999798f3399&DIFFUSEUR=SITE_FIDUCAR&ANNONCEUR=ag942850').then(async r => {
  
          const annonces = r.data.annonce
          // console.log(annonces[0]);
        
          console.log('annonces: ', annonces.length);
        
          const products = []
          var collecting = true
          var page_number = 1
          while (collecting === true) {
            await axios.get('https://fiducar.com/wp-json/wc/v3/products', {
              auth: {
                username: "dsfdytutysfsdfdsfsdfds",
                password: "BA15 0lyp KSk6 VDG8 YZRN 2RnW"
              },
              params: {
                per_page: 99,
                page: page_number
              }
            }).then(r => {
              // console.log('collecting product_cat', r.data);
              if (r.data.length === 0) collecting = false
              for (const p of r.data) products.push(p)
              page_number++
              return r.data
            }).catch(err => {
              console.log('error', err.response.data);
              collecting = false
            })
          }
          console.log("products: ", products.length);
          // console.log("products: ", products[0]);
          // return
        
          var wc_categories = []
          var collecting = true
          var page_number = 1
          while (collecting === true) {
            await axios.get('https://fiducar.com/wp-json/wc/v3/products/categories', {
              auth: {
                username: "dsfdytutysfsdfdsfsdfds",
                password: "BA15 0lyp KSk6 VDG8 YZRN 2RnW"
              },
              params: {
                per_page: 99,
                page: page_number
              }
            }).then(r => {
              // console.log('collecting product_cat', r.data);
              if (r.data.length === 0) collecting = false
              for (const p of r.data) wc_categories.push(p)
              page_number++
              return r.data
            }).catch(err => {
              console.log('error', err.response.data);
              collecting = false
            })
          }
          console.log("products_cat: ", wc_categories.length);
          
          for (const annonce of annonces) {
        
            console.log('annonce', annonces.indexOf(annonce));
        
            annonce.vehicule.modele = annonce.vehicule.modele.replace(/(\s$|^\s)/gi, "")
            annonce.vehicule.marque = annonce.vehicule.marque.replace(/(\s$|^\s)/gi, "")
        
            wc_categories = []
            var collecting = true
            var page_number = 1
            while (collecting === true) {
              await axios.get('https://fiducar.com/wp-json/wc/v3/products/categories', {
                auth: {
                  username: "dsfdytutysfsdfdsfsdfds",
                  password: "BA15 0lyp KSk6 VDG8 YZRN 2RnW"
                },
                params: {
                  per_page: 99,
                  page: page_number
                }
              }).then(r => {
                // console.log('collecting product_cat', r.data);
                if (r.data.length === 0) collecting = false
                for (const p of r.data) wc_categories.push(p)
                page_number++
                return r.data
              }).catch(err => {
                console.log('error', err);
                collecting = false
              })
            }
            console.log("products_cat: ", wc_categories.length);
        
            if (!wc_categories.find( wcc => 
                [wcc.slug, wcc.name].includes(annonce.vehicule.marque)
              )) {
              console.log(annonce.vehicule.marque + ' product_cat is missing');
              const wcc = await axios.post('https://fiducar.com/wp-json/wc/v3/products/categories',
                {
                  name: annonce.vehicule.marque
                }, {
                auth: {
                  username: "dsfdytutysfsdfdsfsdfds",
                  password: "BA15 0lyp KSk6 VDG8 YZRN 2RnW"
                }
              }).then(r => {
                console.log(annonce.vehicule.marque + ' product_cat is created');
                return r.data
              }).catch(err => {
                // console.log("error", err);
                return err.response.data
              })
              if (wcc.code === "term_exist") {
                console.log('marque already exist', wcc.data.ressource_id);
                annonce.vehicule.marque = wcc.data.ressource_id
              }
            }
        
            if (!wc_categories.find( wcc => 
                [wcc.slug, wcc.name].includes(annonce.vehicule.modele)
              )) {
              console.log(annonce.vehicule.modele + ' product_cat is missing');
              const wcc = await axios.post('https://fiducar.com/wp-json/wc/v3/products/categories',
                {
                  name: annonce.vehicule.modele
                }, {
                auth: {
                  username: "dsfdytutysfsdfdsfsdfds",
                  password: "BA15 0lyp KSk6 VDG8 YZRN 2RnW"
                }
              }).then(r => {
                console.log(annonce.vehicule.modele + ' product_cat is created');
                return r.data
              }).catch(err => {
                // console.log("error", err);
                return err.response.data
              })
              if (wcc.code === "term_exist") {
                console.log('modele already exist', wcc.data.ressource_id);
                annonce.vehicule.modele = wcc.data.ressource_id
              }
            }
        
            const categories = [
              'catalogue',
              'achat',
              'auto',
              annonce.vehicule.marque,
              annonce.vehicule.modele,
            ].map(cat => wc_categories.find(wcc => wcc.slug === cat.toLowerCase() || wcc.id === cat) || {})
            // console.log(categories);
        
            console.log(annonce.offre.prix);
        
            // break
        
            // var item = products.find(p => p.name ===) || {}
            const item = {
              name: annonce.titre,    
              type: 'simple',
              status: 'publish',
              // featured: false,
              catalog_visibility: 'visible',
              // description: annonce.PUBLIC_COMMENTS_LEBONCOIN[0],
              short_description: annonce.texte,
              // sku: '',
              // price: annonce.offre[0].prix_marchand[0],
              regular_price: annonce.offre.prix.toString(),
              // sale_price: annonce.offre[0].prix[0],
              // date_on_sale_from: null,
              // date_on_sale_from_gmt: null,
              // date_on_sale_to: null,
              // date_on_sale_to_gmt: null,
              // on_sale: false,
              purchasable: true,
              // total_sales: 0,
              virtual: false,
              downloadable: false,
              // downloads: [],
              // download_limit: -1,
              // download_expiry: -1,
              // external_url: '',
              // button_text: '',
              tax_status: 'taxable',
              tax_class: '',
              // manage_stock: false,
              // stock_quantity: null,
              // backorders: 'no',
              // backorders_allowed: false,
              // backordered: false,
              // low_stock_amount: null,
              // sold_individually: false,
              // weight: '',
              // dimensions: { length: '', width: '', height: '' },
              // shipping_required: true,
              // shipping_taxable: true,
              // shipping_class: '',
              // shipping_class_id: 0,
              reviews_allowed: true,
              // average_rating: '0',
              // rating_count: 0,
              // upsell_ids: [],
              // cross_sell_ids: [],
              // parent_id: 0,
              // purchase_note: '',
              categories: categories,
              // tags: [],
              images: await annonce.photos.map(url => {return {src: url}}),
              attributes: [
                {
                  "id": 2,
                  "name": "Année",
                  "slug": "pa_annee",
                  "position": 0,
                  "visible": true,
                  "variation": false,
                  "options": annonce.vehicule.mise_en_circulation
              },
              {
                  "id": 3,
                  "name": "Boite de vitesse",
                  "slug": "pa_boite-de-vitesse",
                  "position": 1,
                  "visible": true,
                  "variation": false,
                  "options": annonce.vehicule.boite_de_vitesse
              },
              {
                  "id": 6,
                  "name": "Carburant",
                  "slug": "pa_carburant",
                  "position": 2,
                  "visible": true,
                  "variation": false,
                  "options": annonce.vehicule.energie
              },
              {
                  "id": 1,
                  "name": "Couleurs",
                  "slug": "pa_couleurs",
                  "position": 3,
                  "visible": true,
                  "variation": false,
                  "options": annonce.vehicule.couleur
              },
              {
                  "id": 4,
                  "name": "Catégories voiture",
                  "slug": "pa_categories-voiture",
                  "position": 4,
                  "visible": true,
                  "variation": false,
                  "options": annonce.vehicule.carrosserie_brute
              },
              {
                  "id": 5,
                  "name": "Kilométrage",
                  "slug": "pa_kilometrage",
                  "position": 5,
                  "visible": true,
                  "variation": false,
                  "options": annonce.vehicule.kilometrage
              }
              ],
              meta_data: [
                {
                  key: 'ubiflow_id',
                  value: annonce.id
                }
              ],
              stock_status: 'instock',
            }
            // if (parseInt(annonce.offre[0].prix_marchand[0]) > parseInt(annonce.offre[0].prix[0])) {
            //   item.regular_price = annonce.offre[0].prix_marchand[0]
            //   item.sale_price = annonce.offre[0].prix[0]
            // }
        
            // console.log(item);
            
            const product = products.find(p => p.meta_data.some(md => md.key === 'ubiflow_id' && parseInt(md.value) === parseInt(annonce.id)))
            // console.log(product);
        
            if (!product || typeof product === 'undefined') {
        
              console.log("posting");
              const posting = await axios.post(
                'https://fiducar.com/wp-json/wc/v3/products', 
                item, 
                {
                  auth: {
                    username: "dsfdytutysfsdfdsfsdfds",
                    password: "BA15 0lyp KSk6 VDG8 YZRN 2RnW"
                  }
                }
              ).then(r => {
                console.log('posting ok');
                return r.data
              }).catch(err => {
                console.log('error', err.response.data);
                return err.response
              })
        
            } else {
              
              console.log("putting");
              const putting = await axios.put(
                'https://fiducar.com/wp-json/wc/v3/products/' + product.id, 
                item, 
                {
                  auth: {
                    username: "dsfdytutysfsdfdsfsdfds",
                    password: "BA15 0lyp KSk6 VDG8 YZRN 2RnW"
                  }
                }
              ).then(r => {
                console.log("putting ok");
                return r.data
              }).catch(err => {
                console.log('error', err.response.data);
                return err.response
              })
        
            }
        
          }
        
          console.log('end sync annonce');
          
          for (const product of products) {
        
            console.log('product', products.indexOf(product));
        
            if (product.categories.some(c => c.slug === "shop")) {
              console.log("product in shop");
              continue
            }
        
            if (product.categories.some(c => c.slug === "deja-vendu")) {
              console.log("product in deja-vendu");
              continue
            }
        
            var ubiflow_id = product.meta_data.find(md => md.key === 'ubiflow_id')
            if (!ubiflow_id || ubiflow_id === "") {
              console.log('no ubiflow_id');
              await axios.delete('https://fiducar.com/wp-json/wc/v3/products/' + product.id, {
                auth: {
                  username: "dsfdytutysfsdfdsfsdfds",
                  password: "BA15 0lyp KSk6 VDG8 YZRN 2RnW"
                }
              })
              continue
            }
        
            if (!annonces.find(a => parseInt(a.id) === parseInt(ubiflow_id.value))) {
              // console.log(ubiflow_id);
              console.log("annonce doesn't exist", ubiflow_id.value);
              await axios.delete('https://fiducar.com/wp-json/wc/v3/products/' + product.id, {
                auth: {
                  username: "dsfdytutysfsdfdsfsdfds",
                  password: "BA15 0lyp KSk6 VDG8 YZRN 2RnW"
                }
              })
            }
        
          }
        
          console.log('end sync product');
      
        }).catch(err => console.log(err))
      } catch (error) { console.log(error); break }
  }
}()

